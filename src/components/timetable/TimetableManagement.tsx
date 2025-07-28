
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Clock, MapPin, User, Calendar, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

const TimetableManagement: React.FC = () => {
  const { profile } = useUserProfile();
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const { toast } = useToast();

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    if (profile?.id) {
      fetchTimetableSlots();
      fetchRooms();
    }
  }, [profile?.id]);

  const fetchTimetableSlots = async () => {
    try {
      let query = supabase
        .from('timetable_slots')
        .select(`
          *,
          courses (
            course_name,
            course_code
          ),
          rooms (
            room_number,
            building,
            floor
          ),
          instructor:user_profiles!timetable_slots_instructor_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true);

      // Filter based on user role
      if (profile?.user_type === 'student') {
        // Get enrolled courses for student
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', profile.id);

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id);
          query = query.in('course_id', courseIds);
        }
      } else if (profile?.user_type === 'faculty') {
        // Get courses taught by faculty
        query = query.eq('instructor_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimetableSlots(data || []);
    } catch (error) {
      console.error('Error fetching timetable slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch timetable',
        variant: 'destructive'
      });
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('college_id', profile?.college_id)
        .eq('is_available', true)
        .order('building', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotTypeColor = (slotType: string) => {
    switch (slotType) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800';
      case 'lab':
        return 'bg-purple-100 text-purple-800';
      case 'tutorial':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlotIcon = (slotType: string) => {
    switch (slotType) {
      case 'lecture':
        return <BookOpen className="h-4 w-4" />;
      case 'lab':
        return <Calendar className="h-4 w-4" />;
      case 'tutorial':
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSlotsForDay = (dayOfWeek: number) => {
    return timetableSlots.filter(slot => slot.day_of_week === dayOfWeek);
  };

  const getSlotsForTime = (dayOfWeek: number, timeSlot: string) => {
    return timetableSlots.filter(slot => 
      slot.day_of_week === dayOfWeek && 
      slot.start_time === timeSlot + ':00'
    );
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading timetable...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timetable & Schedule</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {profile?.user_type === 'student' ? 'Student View' : 'Faculty View'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="rooms">Room Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted">Time</th>
                      {daysOfWeek.slice(1, 6).map(day => (
                        <th key={day} className="border p-2 bg-muted min-w-[150px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(timeSlot => (
                      <tr key={timeSlot}>
                        <td className="border p-2 font-medium bg-muted">
                          {formatTime(timeSlot + ':00')}
                        </td>
                        {[1, 2, 3, 4, 5].map(dayIndex => {
                          const slots = getSlotsForTime(dayIndex, timeSlot);
                          return (
                            <td key={dayIndex} className="border p-1 align-top">
                              <div className="space-y-1">
                                {slots.map(slot => (
                                  <div
                                    key={slot.id}
                                    className="p-2 rounded text-xs border bg-card"
                                  >
                                    <div className="font-medium mb-1">
                                      {slot.courses.course_code}
                                    </div>
                                    <div className="text-muted-foreground mb-1">
                                      {slot.courses.course_name}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <Badge className={getSlotTypeColor(slot.slot_type)}>
                                        {slot.slot_type}
                                      </Badge>
                                      <div className="flex items-center space-x-1 text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{slot.rooms.room_number}</span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daily Schedule</span>
                <div className="flex items-center space-x-2">
                  {daysOfWeek.map((day, index) => (
                    <Button
                      key={day}
                      variant={selectedDay === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDay(index)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
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
                      .map(slot => (
                        <div key={slot.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {getSlotIcon(slot.slot_type)}
                              <div>
                                <h4 className="font-medium">
                                  {slot.courses.course_code} - {slot.courses.course_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {slot.instructor.first_name} {slot.instructor.last_name}
                                </p>
                              </div>
                            </div>
                            <Badge className={getSlotTypeColor(slot.slot_type)}>
                              {slot.slot_type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {slot.rooms.room_number} - {slot.rooms.building}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Room Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => {
                  const roomSlots = timetableSlots.filter(slot => slot.room_id === room.id);
                  
                  return (
                    <div key={room.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{room.room_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {room.building} - Floor {room.floor}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Capacity: {room.capacity}
                          </div>
                          <Badge variant="outline">{room.room_type}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Scheduled Classes: {roomSlots.length}
                        </div>
                        
                        {roomSlots.length > 0 && (
                          <div className="space-y-1">
                            {roomSlots.slice(0, 3).map(slot => (
                              <div key={slot.id} className="text-xs p-2 bg-muted rounded">
                                <div className="font-medium">
                                  {slot.courses.course_code}
                                </div>
                                <div className="text-muted-foreground">
                                  {daysOfWeek[slot.day_of_week]} {formatTime(slot.start_time)}
                                </div>
                              </div>
                            ))}
                            {roomSlots.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{roomSlots.length - 3} more classes
                              </div>
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
