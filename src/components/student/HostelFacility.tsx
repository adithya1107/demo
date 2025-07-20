
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Users, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface HostelFacilityProps {
  studentData: any;
}

const HostelFacility = ({ studentData }: HostelFacilityProps) => {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    roomType: '',
    preferences: '',
    emergencyContact: '',
    medicalInfo: ''
  });

  const handleApplicationSubmit = () => {
    if (!applicationData.roomType) {
      toast({
        title: 'Missing Information',
        description: 'Please select a room type.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Application Submitted',
      description: 'Your hostel application has been submitted successfully. You will be notified once reviewed.',
    });
    
    setShowApplicationForm(false);
    setApplicationData({
      roomType: '',
      preferences: '',
      emergencyContact: '',
      medicalInfo: ''
    });
  };

  const availableRooms = [
    { id: 1, type: 'Single', price: '₹8,000/month', available: 12, amenities: ['AC', 'Wi-Fi', 'Laundry'] },
    { id: 2, type: 'Double Sharing', price: '₹5,000/month', available: 8, amenities: ['Wi-Fi', 'Laundry', 'Common Room'] },
    { id: 3, type: 'Triple Sharing', price: '₹3,500/month', available: 15, amenities: ['Wi-Fi', 'Laundry'] }
  ];

  const applicationHistory = [
    { id: 1, date: '2024-01-15', type: 'Single Room', status: 'pending', remarks: 'Under review' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <Building className="h-6 w-6 text-role-student" />
            <span>Hostel & Facility Management</span>
          </CardTitle>
          <CardDescription>Apply for hostel accommodation and manage facility requests</CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 hover:border-role-student/20 transition-colors cursor-pointer" 
              onClick={() => setShowApplicationForm(true)}>
          <CardContent className="p-6 text-center">
            <Building className="h-8 w-8 text-role-student mx-auto mb-2" />
            <h3 className="font-medium text-card-foreground">Apply for Hostel</h3>
            <p className="text-sm text-muted-foreground">Submit new application</p>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 hover:border-role-student/20 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-card-foreground">Room Availability</h3>
            <p className="text-sm text-muted-foreground">Check available rooms</p>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 hover:border-role-student/20 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-card-foreground">Facility Requests</h3>
            <p className="text-sm text-muted-foreground">Report issues</p>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 hover:border-role-student/20 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-medium text-card-foreground">Application History</h3>
            <p className="text-sm text-muted-foreground">View past applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <Card className="border-role-student/20 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-role-student">New Hostel Application</CardTitle>
            <CardDescription>Fill in the details to apply for hostel accommodation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-type">Room Type</Label>
                <Select value={applicationData.roomType} onValueChange={(value) => 
                  setApplicationData({...applicationData, roomType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Room</SelectItem>
                    <SelectItem value="double">Double Sharing</SelectItem>
                    <SelectItem value="triple">Triple Sharing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency-contact">Emergency Contact</Label>
                <Input
                  id="emergency-contact"
                  placeholder="Enter emergency contact number"
                  value={applicationData.emergencyContact}
                  onChange={(e) => setApplicationData({...applicationData, emergencyContact: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferences">Room Preferences</Label>
              <Textarea
                id="preferences"
                placeholder="Any specific preferences or requirements"
                value={applicationData.preferences}
                onChange={(e) => setApplicationData({...applicationData, preferences: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="medical-info">Medical Information (Optional)</Label>
              <Textarea
                id="medical-info"
                placeholder="Any medical conditions or special requirements"
                value={applicationData.medicalInfo}
                onChange={(e) => setApplicationData({...applicationData, medicalInfo: e.target.value})}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={handleApplicationSubmit} className="bg-role-student hover:bg-role-student/90">
                Submit Application
              </Button>
              <Button variant="outline" onClick={() => setShowApplicationForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Rooms */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-card-foreground">Available Hostel Rooms</CardTitle>
            <CardDescription>Current room availability and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableRooms.map((room) => (
              <div key={room.id} className="p-4 border border-white/10 rounded-lg hover:border-role-student/20 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-card-foreground">{room.type}</h4>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    {room.available} available
                  </Badge>
                </div>
                <p className="text-lg font-bold text-role-student mb-2">{room.price}</p>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Application History */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-card-foreground">Application History</CardTitle>
            <CardDescription>Your previous hostel applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicationHistory.length > 0 ? (
              applicationHistory.map((app) => (
                <div key={app.id} className="p-4 border border-white/10 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-card-foreground">{app.type}</h4>
                      <p className="text-sm text-muted-foreground">Applied on {app.date}</p>
                    </div>
                    <Badge 
                      variant={app.status === 'approved' ? 'default' : app.status === 'pending' ? 'secondary' : 'destructive'}
                      className="flex items-center space-x-1"
                    >
                      {app.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                      {app.status === 'pending' && <Clock className="h-3 w-3" />}
                      {app.status === 'rejected' && <XCircle className="h-3 w-3" />}
                      <span className="capitalize">{app.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{app.remarks}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No applications found</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setShowApplicationForm(true)}
                >
                  Apply Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostelFacility;
