import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { MessageSquare, Send, Users, Hash, Plus, Search, Heart, ThumbsUp, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommunicationChannel {
  id: string;
  channel_name: string;
  channel_type: string;
  description: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  message_text: string;
  message_type: string;
  file_url: string;
  reply_to_id: string;
  is_edited: boolean;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    user_type: string;
  };
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: {
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

const CommunicationHub: React.FC = () => {
  const { profile } = useUserProfile();
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchChannels();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      fetchChannelMembers(selectedChannel.id);
    }
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      // Use .from() with type assertion for better type safety
      const { data, error } = await supabase
        .from('communication_channels' as any)
        .select('*')
        .eq('college_id', profile?.college_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannels((data as unknown as CommunicationChannel[]) || []);
      
      // Set first channel as selected if available
      if (data && data.length > 0) {
        setSelectedChannel(data[0] as unknown as CommunicationChannel);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch communication channels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages' as any)
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey (
            first_name,
            last_name,
            user_type
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as unknown as Message[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchChannelMembers = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('channel_members' as any)
        .select(`
          *,
          user:user_profiles!channel_members_user_id_fkey (
            first_name,
            last_name,
            user_type
          )
        `)
        .eq('channel_id', channelId);

      if (error) throw error;
      setMembers((data as unknown as ChannelMember[]) || []);
    } catch (error) {
      console.error('Error fetching channel members:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      const { error } = await supabase
        .from('messages' as any)
        .insert({
          channel_id: selectedChannel.id,
          sender_id: profile?.id,
          message_text: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;
      
      setNewMessage('');
      await fetchMessages(selectedChannel.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const joinChannel = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('channel_members' as any)
        .insert({
          channel_id: channelId,
          user_id: profile?.id,
          role: 'member'
        });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Joined channel successfully',
      });
      
      await fetchChannels();
    } catch (error) {
      console.error('Error joining channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to join channel',
        variant: 'destructive'
      });
    }
  };

  const addReaction = async (messageId: string, reactionType: string) => {
    try {
      const { error } = await supabase
        .from('message_reactions' as any)
        .insert({
          message_id: messageId,
          user_id: profile?.id,
          reaction_type: reactionType
        });

      if (error) throw error;
      
      // Refresh messages to show updated reactions
      if (selectedChannel) {
        await fetchMessages(selectedChannel.id);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive'
      });
    }
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'announcement':
        return <Hash className="h-4 w-4" />;
      case 'discussion':
        return <MessageSquare className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelTypeColor = (channelType: string) => {
    switch (channelType) {
      case 'announcement':
        return 'bg-red-100 text-red-800';
      case 'discussion':
        return 'bg-blue-100 text-blue-800';
      case 'group':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'student':
        return 'text-blue-600';
      case 'faculty':
        return 'text-purple-600';
      case 'admin':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getReactionIcon = (reactionType: string) => {
    switch (reactionType) {
      case 'like':
        return <ThumbsUp className="h-4 w-4" />;
      case 'love':
        return <Heart className="h-4 w-4" />;
      case 'laugh':
        return <Smile className="h-4 w-4" />;
      default:
        return <ThumbsUp className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredChannels = channels.filter(channel =>
    channel.channel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading communication hub...</div>;
  }

  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Communication Hub</h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New Channel
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChannel?.id === channel.id
                    ? 'bg-primary/10 border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedChannel(channel)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {getChannelIcon(channel.channel_type)}
                    <span className="font-medium text-sm">{channel.channel_name}</span>
                  </div>
                  <Badge className={getChannelTypeColor(channel.channel_type)}>
                    {channel.channel_type}
                  </Badge>
                </div>
                
                {channel.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {channel.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {channel.member_count || 0} members
                  </span>
                  {channel.is_public && (
                    <Badge variant="outline" className="text-xs">
                      Public
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getChannelIcon(selectedChannel.channel_type)}
                  <div>
                    <h3 className="font-semibold">{selectedChannel.channel_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedChannel.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getChannelTypeColor(selectedChannel.channel_type)}>
                    {selectedChannel.channel_type}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Users className="h-4 w-4 mr-1" />
                    {members.length} members
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {message.sender.first_name[0]}{message.sender.last_name[0]}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.sender.first_name} {message.sender.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {message.sender.user_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-3 mb-2">
                          <p className="text-sm">{message.message_text}</p>
                        </div>
                        
                        {/* Reactions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addReaction(message.id, 'like')}
                            className="h-6 px-2"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addReaction(message.id, 'love')}
                            className="h-6 px-2"
                          >
                            <Heart className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addReaction(message.id, 'laugh')}
                            className="h-6 px-2"
                          >
                            <Smile className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-center space-x-2">
                <Textarea
                  placeholder={`Message #${selectedChannel.channel_name}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Select a channel to start communicating
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationHub;