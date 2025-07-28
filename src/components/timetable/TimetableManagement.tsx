/* --------------------------------------------------------------------------
   TimetableManagement.tsx
--------------------------------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Clock, MapPin, User, Calendar, BookOpen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/* ─────────────────────────
   Domain – shared interfaces
   ───────────────────────── */
interface TimetableSlot {
  id: string;
  course_id: string;
  instructor_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_type: string;
  academic_year: string;
  semester: string;
  is_active: boolean;
  courses: {
    course_name: string;
    course_code: string;
  };
  rooms: {
    room_number: string;
    building: string;
    floor: number;
  };
  instructor: {
    first_name: string;
    last_name: string;
  };
}

interface Room {
  id: string;
  room_number: string;
  building: string;
  floor: number;
  capacity: number;
  room_type: string;
  is_available: boolean;
  college_id: string;
  created_at: string;
  updated_at: string;
}

/* Raw DB record interfaces
   ───────────────────────── */
interface RawTimetableSlot {
  id: string;
  course_id: string;
  instructor_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_type: string;
  academic_year: string;
  semester: string;
  is_active: boolean;
}

interface RawCourse {
  id: string;
  course_name: string;
  course_code: string;
}

interface RawRoom {
  id: string;
  room_number: string;
  building: string;
  floor: number;
}

interface RawInstructor {
  id: string;
  first_name: string;
  last_name: string;
}

/* ─────────────────────────
   Helper: type-safe RPC wrap
   ───────────────────────── */
const callRpc = async <T,>(
  fnName: string,
  params?: Record<string, unknown>,
) => {
  // “as any” here avoids the union-of-known-functions constraint.
  return (supabase.rpc as any)<T>(fnName, params ?? {});
};

/* ─────────────────────────
   Main component
   ───────────────────────── */
const TimetableManagement: React.FC = () => {
  const { profile } = useUserProfile();
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const { toast } = useToast();

  /* Display helpers */
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  ];

  /* ────────────────
     Data fetch hooks
     ─────────────── */
  useEffect(() => {
    if (profile?.id) {
      fetchTimetableSlots();
      fetchRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  /* Timetable slots (primary) */
  const fetchTimetableSlots = async () => {
    try {
      const { data: slotsData, error: slotsError } =
        await callRpc<RawTimetableSlot[]>('get_timetable_slots_raw');

      /* Fallback if RPC missing */
      if (slotsError || !slotsData) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from<RawTimetableSlot>('timetable_slots')
          .select('*')
          .eq('is_active', true);

        if (fallbackError) throw fallbackError;
        await processRawSlots(fallbackData ?? []);
        return;
      }

      await processRawSlots(slotsData);
    } catch (error) {
      console.error('Error fetching timetable slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch timetable',
        variant: 'destructive',
      });
      setTimetableSlots([]);
    }
  };

  /* Transform & enrich slots with joined data */
  const processRawSlots = async (rawSlots: RawTimetableSlot[]) => {
    if (!rawSlots.length) {
      setTimetableSlots([]);
      return;
    }

    /* Role-based filtering */
    let filteredSlots = rawSlots;
    if (profile?.user_type === 'student') {
      const { data: enrollments } = await supabase
        .from<{ course_id: string }>('enrollments')
        .select('course_id')
        .eq('student_id', profile.id);

      const courseIds = (enrollments ?? []).map((e) => e.course_id);
      filteredSlots = rawSlots.filter((s) => courseIds.includes(s.course_id));
    } else if (profile?.user_type === 'faculty') {
      filteredSlots = rawSlots.filter((s) => s.instructor_id === profile.id);
    }

    /* Gather IDs for batch fetches */
    const courseIds = [...new Set(filteredSlots.map((s) => s.course_id))];
    const roomIds = [...new Set(filteredSlots.map((s) => s.room_id))];
    const instructorIds = [...new Set(filteredSlots.map((s) => s.instructor_id))];

    /* Parallel lookups */
    const [{ data: coursesData }, roomsResp, { data: instructorsData }] =
      await Promise.all([
        supabase
          .from<RawCourse>('courses')
          .select('id, course_name, course_code')
          .in('id', courseIds),

        (async () => {
          const { data: roomsRpcData, error: roomsRpcError } =
            await callRpc<RawRoom[]>('get_rooms_by_ids', { room_ids: roomIds });
          if (roomsRpcError || !roomsRpcData) {
            const { data: roomsFallback } = await supabase
              .from<RawRoom>('rooms')
              .select('id, room_number, building, floor')
              .in('id', roomIds);
            return { data: roomsFallback };
          }
          return { data: roomsRpcData };
        })(),

        supabase
          .from<RawInstructor>('user_profiles')
          .select('id, first_name, last_name')
          .in('id', instructorIds),
      ]);

    /* Build lookup maps */
    const coursesMap = new Map((coursesData ?? []).map((c) => [c.id, c]));
    const roomsMap = new Map((roomsResp.data ?? []).map((r) => [r.id, r]));
    const instructorsMap = new Map((instructorsData ?? []).map((i) => [i.id, i]));

    /* Final transformation */
    const transformed: TimetableSlot[] = filteredSlots.map((slot) => ({
      ...slot,
      courses: coursesMap.get(slot.course_id) ?? { course_name: 'Unknown', course_code: 'N/A' },
      rooms: roomsMap.get(slot.room_id) ?? {
        room_number: 'Unknown', building: 'Unknown', floor: 0,
      },
      instructor: instructorsMap.get(slot.instructor_id) ?? {
        first_name: 'Unknown', last_name: 'Instructor',
      },
    }));

    setTimetableSlots(transformed);
  };

  /* Rooms (for “Room Schedule” tab) */
  const fetchRooms = async () => {
    try {
      const { data: rpcRooms, error: rpcError } =
        await callRpc<Room[]>('get_college_rooms', { college_id: profile?.college_id });

      if (rpcError || !rpcRooms) {
        const { data: fallbackRooms, error: fallbackError } = await supabase
          .from<Room>('rooms')
          .select('*')
          .eq('college_id', profile?.college_id)
          .eq('is_available', true)
          .order('building', { ascending: true });

        if (fallbackError) throw fallbackError;
        setRooms(fallbackRooms ?? []);
      } else {
        setRooms(rpcRooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────
     UI helpers
     ──────────── */
  const getSlotTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-purple-100 text-purple-800';
      case 'tutorial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlotIcon = (type: string) => {
    switch (type) {
      case 'lecture': return <BookOpen className="h-4 w-4" />;
      case 'lab': return <Calendar className="h-4 w-4" />;
      case 'tutorial': return <User className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSlotsForDay = (day: number) =>
    timetableSlots.filter((s) => s.day_of_week === day);

  const getSlotsForTime = (day: number, time: string) =>
    timetableSlots.filter(
      (s) => s.day_of_week === day && s.start_time === `${time}:00`,
    );

  const formatTime = (t: string) => {
    try {
      return new Date(`1970-01-01T${t}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return t;
    }
  };

  /* ─────────────
     Render
     ──────────── */
  if (loading) {
    return <div className="flex justify-center py-8">Loading timetable…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timetable & Schedule</h2>
        <Badge variant="outline">
          {profile?.user_type === 'student' ? 'Student View' : 'Faculty View'}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="rooms">Room Schedule</TabsTrigger>
        </TabsList>

        {/* Weekly View */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader><CardTitle>Weekly Timetable</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted">Time</th>
                      {daysOfWeek.slice(1, 6).map((day) => (
                        <th key={day} className="border p-2 bg-muted min-w-[150px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => (
                      <tr key={slot}>
                        <td className="border p-2 font-medium bg-muted">
                          {formatTime(`${slot}:00`)}
                        </td>
                        {[1, 2, 3, 4, 5].map((d) => (
                          <td key={d} className="border p-1 align-top">
                            <div className="space-y-1">
                              {getSlotsForTime(d, slot).map((s) => (
                                <div
                                  key={s.id}
                                  className="p-2 rounded text-xs border bg-card"
                                >
                                  <div className="font-medium mb-1">
                                    {s.courses.course_code}
                                  </div>
                                  <div className="text-muted-foreground mb-1">
                                    {s.courses.course_name}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Badge className={getSlotTypeColor(s.slot_type)}>
                                      {s.slot_type}
                                    </Badge>
                                    <div className="flex items-center space-x-1 text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{s.rooms.room_number}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatTime(s.start_time)} – {formatTime(s.end_time)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily View */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daily Schedule</span>
                <div className="flex items-center space-x-2">
                  {daysOfWeek.map((day, idx) => (
                    <Button
                      key={day}
                      variant={selectedDay === idx ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDay(idx)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-medium mb-4">
                {daysOfWeek[selectedDay]} Schedule
              </h3>

              {getSlotsForDay(selectedDay).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No classes scheduled for {daysOfWeek[selectedDay]}
                </p>
              ) : (
                <div className="space-y-3">
                  {getSlotsForDay(selectedDay)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((s) => (
                      <div key={s.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {getSlotIcon(s.slot_type)}
                            <div>
                              <h4 className="font-medium">
                                {s.courses.course_code} – {s.courses.course_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {s.instructor.first_name} {s.instructor.last_name}
                              </p>
                            </div>
                          </div>
                          <Badge className={getSlotTypeColor(s.slot_type)}>
                            {s.slot_type}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{s.rooms.room_number} – {s.rooms.building}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Room Schedule */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader><CardTitle>Room Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => {
                  const roomSlots = timetableSlots.filter((s) => s.room_id === room.id);
                  return (
                    <div key={room.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{room.room_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {room.building} – Floor {room.floor}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Capacity: {room.capacity}
                          </p>
                          <Badge variant="outline">{room.room_type}</Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Scheduled Classes: {roomSlots.length}
                        </p>

                        {roomSlots.length > 0 && (
                          <div className="space-y-1">
                            {roomSlots.slice(0, 3).map((s) => (
                              <div key={s.id} className="text-xs p-2 bg-muted rounded">
                                <p className="font-medium">{s.courses.course_code}</p>
                                <p className="text-muted-foreground">
                                  {daysOfWeek[s.day_of_week]} {formatTime(s.start_time)}
                                </p>
                              </div>
                            ))}
                            {roomSlots.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{roomSlots.length - 3} more classes
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimetableManagement;
