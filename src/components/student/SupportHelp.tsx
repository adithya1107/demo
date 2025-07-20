
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MessageSquare, Phone, Mail, Clock, Send } from 'lucide-react';

interface SupportHelpProps {
  studentData: any;
}

const SupportHelp = ({ studentData }: SupportHelpProps) => {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketData, setTicketData] = useState({
    subject: '',
    category: '',
    priority: 'normal',
    description: ''
  });

  const handleTicketSubmit = () => {
    if (!ticketData.subject || !ticketData.category || !ticketData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Ticket Submitted',
      description: 'Your support ticket has been submitted. You will receive a response within 24 hours.',
    });
    
    setShowTicketForm(false);
    setTicketData({
      subject: '',
      category: '',
      priority: 'normal',
      description: ''
    });
  };

  const contactMethods = [
    {
      icon: Phone,
      title: 'Phone Support',
      info: '+91-8050661601',
      availability: '9:00 AM - 6:00 PM (Mon-Fri)',
      color: 'text-green-500'
    },
    {
      icon: Mail,
      title: 'Email Support',
      info: 'support@colcord.edu',
      availability: 'Response within 24 hours',
      color: 'text-blue-500'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      info: 'Available on website',
      availability: '9:00 AM - 9:00 PM (Mon-Sun)',
      color: 'text-purple-500'
    }
  ];

  const faqItems = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking on "Forgot Password" on the login page or contact IT support.'
    },
    {
      question: 'How do I check my grades?',
      answer: 'Your grades are available in the Dashboard under "Current CGPA" and detailed grades in the Courses section.'
    },
    {
      question: 'How do I apply for certificates?',
      answer: 'You can request certificates through the Support section by creating a ticket with category "Certificate Request".'
    },
    {
      question: 'Who do I contact for academic issues?',
      answer: 'For academic issues, contact your course instructor directly or reach out to the academic office at academic@colcord.edu.'
    },
    {
      question: 'How do I report technical issues?',
      answer: 'Create a support ticket with category "Technical Issue" or contact IT support directly at +91-8050661601.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <HelpCircle className="h-6 w-6 text-role-student" />
            <span>Support & Help Center</span>
          </CardTitle>
          <CardDescription>Get help with your queries and technical issues</CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-white/10 hover:border-role-student/20 transition-colors cursor-pointer" 
              onClick={() => setShowTicketForm(true)}>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-role-student mx-auto mb-2" />
            <h3 className="font-medium text-card-foreground">Create Support Ticket</h3>
            <p className="text-sm text-muted-foreground">Submit a new support request</p>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 hover:border-role-student/20 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-card-foreground">Call Support</h3>
            <p className="text-sm text-muted-foreground">+91-8050661601</p>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 hover:border-role-student/20 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Mail className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-card-foreground">Email Support</h3>
            <p className="text-sm text-muted-foreground">support@colcord.edu</p>
          </CardContent>
        </Card>
      </div>

      {/* Support Ticket Form */}
      {showTicketForm && (
        <Card className="border-role-student/20 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-role-student">Create Support Ticket</CardTitle>
            <CardDescription>Fill in the details to submit your support request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={ticketData.subject}
                  onChange={(e) => setTicketData({...ticketData, subject: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={ticketData.category} onValueChange={(value) => 
                  setTicketData({...ticketData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="academic">Academic Query</SelectItem>
                    <SelectItem value="account">Account Access</SelectItem>
                    <SelectItem value="certificate">Certificate Request</SelectItem>
                    <SelectItem value="hostel">Hostel/Facility</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={ticketData.priority} onValueChange={(value) => 
                setTicketData({...ticketData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your issue"
                value={ticketData.description}
                onChange={(e) => setTicketData({...ticketData, description: e.target.value})}
                rows={4}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={handleTicketSubmit} className="bg-role-student hover:bg-role-student/90">
                <Send className="h-4 w-4 mr-2" />
                Submit Ticket
              </Button>
              <Button variant="outline" onClick={() => setShowTicketForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Methods */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-card-foreground">Contact Information</CardTitle>
            <CardDescription>Get in touch with our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div key={index} className="p-4 border border-white/10 rounded-lg hover:border-role-student/20 transition-colors">
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-6 w-6 ${method.color} flex-shrink-0 mt-1`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground mb-1">{method.title}</h4>
                      <p className="text-sm font-mono text-role-student mb-1">{method.info}</p>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{method.availability}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-card-foreground">Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((faq, index) => (
              <div key={index} className="p-4 border border-white/10 rounded-lg">
                <h4 className="font-medium text-card-foreground mb-2">{faq.question}</h4>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportHelp;
