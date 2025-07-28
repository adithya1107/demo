
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Calendar, Users, Plus, Heart, Share2, MessageCircle } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'event' | 'poll' | 'discussion';
  author_id: string;
  author_name: string;
  created_at: string;
  likes: number;
  comments: number;
  event_date?: string;
  poll_options?: string[];
  poll_votes?: any[];
}

const FurlongCommunityHub = () => {
  const { profile } = useUserProfile();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    loadCommunityPosts();
  }, [profile]);

  const loadCommunityPosts = async () => {
    if (!profile?.college_id) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          created_by:user_profiles!created_by(first_name, last_name)
        `)
        .eq('college_id', profile.college_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform announcements to community posts format
      const transformedPosts: CommunityPost[] = data.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.announcement_type as any,
        author_id: item.created_by,
        author_name: `${item.created_by.first_name} ${item.created_by.last_name}`,
        created_at: item.created_at,
        likes: Math.floor(Math.random() * 50), // Mock data
        comments: Math.floor(Math.random() * 20), // Mock data
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: any) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: postData.title,
          content: postData.content,
          announcement_type: postData.type,
          college_id: profile.college_id,
          created_by: profile.id,
          priority: 'normal',
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Post created successfully!'
      });

      setShowCreatePost(false);
      loadCommunityPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    }
  };

  const PostCard = ({ post }: { post: CommunityPost }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{post.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              by {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="outline">{post.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{post.content}</p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>{post.likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-1">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CreatePostDialog = () => {
    const [postData, setPostData] = useState({
      title: '',
      content: '',
      type: 'discussion'
    });

    const handleSubmit = () => {
      if (!postData.title || !postData.content) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }
      createPost(postData);
    };

    return (
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="Enter post title"
                value={postData.title}
                onChange={(e) => setPostData({...postData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                placeholder="What's on your mind?"
                rows={4}
                value={postData.content}
                onChange={(e) => setPostData({...postData, content: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Create Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Furlong Community</h1>
          <p className="text-muted-foreground">Connect with your college community</p>
        </div>
        <Button onClick={() => setShowCreatePost(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Post</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">
            <MessageSquare className="h-4 w-4 mr-2" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <MessageSquare className="h-4 w-4 mr-2" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to share something with your community!</p>
            </Card>
          ) : (
            posts.map(post => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>

        <TabsContent value="events">
          <Card className="p-8 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Events Coming Soon</h3>
            <p className="text-muted-foreground">Event management features will be available soon!</p>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Groups Coming Soon</h3>
            <p className="text-muted-foreground">Group features will be available soon!</p>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          {posts.filter(post => post.type === 'announcement').map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
      </Tabs>

      <CreatePostDialog />
    </div>
  );
};

export default FurlongCommunityHub;
