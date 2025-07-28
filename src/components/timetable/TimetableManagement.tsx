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
  course?: {
    course_name: string;
    course_code: string;
  };
  room?: {
    room_number: string;
    building: string;
    floor: number;
  };
  instructor?: {
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

// Updated Course interface to match actual database schema
interface Course {
  id: string;
  course_name: string;
  course_code: string;
  credits: number;
  description: string;
  instructor_id: string;
  academic_year: string;
  semester: string;
  max_students: number;
  is_active: boolean;
  college_id: string;
  created_at: string;
  updated_at: string;
}

// Updated Instructor interface to match actual database schema
interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  college_id: string;
  created_at: string;
  updated_at: string;
}

/* ─────────────────────────
   Main component
   ───────────────────────── */
const TimetableManagement: React.FC = () => {
  const { profile } = useUserProfile();
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
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
    if (profile?.id && profile?.college_id) {
      fetchAllData();
    }
  }, [profile?.id, profile?.college_id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCourses(),
        fetchInstructors(),
        fetchRooms(),
        fetchTimetableSlots(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch timetable data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('college_id', profile?.college_id);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, user_type, college_id, created_at, updated_at')
        .eq('college_id', profile?.college_id)
        .eq('user_type', 'faculty');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setInstructors([]);
    }
  };

  const fetchRooms = async () => {
    try {
      // Since 'rooms' table doesn't exist in current schema, create mock data
      // In a real implementation, you'd have a rooms table
      const mockRooms: Room[] = [
        {
          id: '1',
          room_number: 'R101',
          building: 'Main Building',
          floor: 1,
          capacity: 50,
          room_type: 'lecture',
          is_available: true,
          college_id: profile?.college_id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          room_number: 'L201',
          building: 'Science Block',
          floor: 2,
          capacity: 30,
          room_type: 'lab',
          is_available: true,
          college_id: profile?.college_id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          room_number: 'T301',
          building: 'Tutorial Block',
          floor: 3,
          capacity: 25,
          room_type: 'tutorial',
          is_available: true,
          college_id: profile?.college_id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      setRooms(mockRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const fetchTimetableSlots = async () => {
    try {
      // Since timetable_slots table doesn't exist, create mock data
      // In a real implementation, you'd query the actual table
      if (courses.length === 0 || instructors.length === 0 || rooms.length === 0) {
        setTimetableSlots([]);
        return;
      }

      const mockSlots: TimetableSlot[] = courses.map((course, index) => ({
        id: `slot-${index}`,
        course_id: course.id,
        instructor_id: course.instructor_id || instructors[index % instructors.length]?.id || '',
        room_id: rooms[index % rooms.length]?.id || '1',
        day_of_week: (index % 5) + 1, // Monday to Friday
        start_time: `${9 + (index % 8)}:00:00`,
        end_time: `${10 + (index % 8)}:00:00`,
        slot_type: index % 3 === 0 ? 'lecture' : index % 3 === 1 ? 'lab' : 'tutorial',
        academic_year: course.academic_year,
        semester: course.semester,
        is_active: course.is_active,
      }));

      // Enrich with related data
      const enrichedSlots = mockSlots.map(slot => ({
        ...slot,
        course: courses.find(c => c.id === slot.course_id),
        room: rooms.find(r => r.id === slot.room_id),
        instructor: instructors.find(i => i.id === slot.instructor_id),
      }));

      setTimetableSlots(enrichedSlots);
    } catch (error) {
      console.error('Error fetching timetable slots:', error);
      setTimetableSlots([]);
    }
  };

  // Re-fetch timetable slots when dependencies change
  useEffect(() => {
    if (courses.length > 0 && instructors.length > 0 && rooms.length > 0) {
      fetchTimetableSlots();
    }
  }, [courses, instructors, rooms]);

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
      (s) => s.day_of_week === day && s.start_time.startsWith(time)
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
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timetable & Schedule</h2>
        <Badge variant="outline">
          {profile?.user_type === 'student' ? 'Student View' : 
           profile?.user_type === 'faculty' ? 'Faculty View' : 'Admin View'}
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-xl font-bold">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Instructors</p>
                <p className="text-xl font-bold">{instructors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Rooms</p>
                <p className="text-xl font-bold">{rooms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Slots</p>
                <p className="text-xl font-bold">{timetableSlots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                                    {s.course?.course_code || 'N/A'}
                                  </div>
                                  <div className="text-muted-foreground mb-1">
                                    {s.course?.course_name || 'Unknown Course'}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Badge className={getSlotTypeColor(s.slot_type)}>
                                      {s.slot_type}
                                    </Badge>
                                    <div className="flex items-center space-x-1 text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{s.room?.room_number || 'TBD'}</span>
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
                                {s.course?.course_code || 'N/A'} – {s.course?.course_name || 'Unknown Course'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {s.instructor?.first_name} {s.instructor?.last_name}
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
                            <span>{s.room?.room_number || 'TBD'} – {s.room?.building || 'TBD'}</span>
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
                                <p className="font-medium">{s.course?.course_code}</p>
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
