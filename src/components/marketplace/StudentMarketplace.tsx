import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, ShoppingCart, Filter, Heart, Star } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ProductListingForm from './ProductListingForm';

interface MarketplaceItem {
  id: string;
  seller_id: string;
  college_id: string;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category: string;
  images: string[];
  status: 'active' | 'sold' | 'reserved';
  created_at: string;
  seller_name?: string;
  seller_contact?: string;
}

const StudentMarketplace = () => {
  const { profile } = useUserProfile();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [showListingForm, setShowListingForm] = useState(false);
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());

  const categories = [
    'all', 'books', 'electronics', 'clothing', 'furniture', 'sports', 'other'
  ];

  const conditions = [
    'all', 'new', 'like_new', 'good', 'fair', 'poor'
  ];

  useEffect(() => {
    if (profile) {
      fetchMarketplaceItems();
    }
  }, [profile]);

  useEffect(() => {
    applyFilters();
  }, [items, searchTerm, selectedCategory, selectedCondition]);

  const fetchMarketplaceItems = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          user_profiles!marketplace_items_seller_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('college_id', profile?.college_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems: MarketplaceItem[] = data?.map(item => {
        // Assume item.user_profiles is an array due to the foreign key relation
        const userProfile = Array.isArray(item.user_profiles) && item.user_profiles.length > 0
          ? item.user_profiles[0]
          : null;

        return {
          id: item.id,
          seller_id: item.seller_id,
          college_id: item.college_id,
          title: item.title || '',
          description: item.description || '',
          price: item.price || 0,
          condition: item.condition as 'new' | 'like_new' | 'good' | 'fair' | 'poor',
          category: item.category || '',
          images: item.images || [],
          status: item.status as 'active' | 'sold' | 'reserved',
          created_at: item.created_at,
          seller_name: userProfile
            ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
            : 'Unknown',
          seller_contact: userProfile?.email || ''
        };
      }) || [];

      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    setFilteredItems(filtered);
  };

  const handleBuyItem = async (item: MarketplaceItem) => {
    if (!profile) return;

    try {
      // Check if user has sufficient funds or implement payment gateway
      const transactionData = {
        item_id: item.id,
        buyer_id: profile.id,
        seller_id: item.seller_id,
        college_id: profile.college_id,
        amount: item.price,
        status: 'pending'
      };

      const { error } = await supabase
        .from('marketplace_transactions')
        .insert(transactionData);

      if (error) throw error;

      // Mark item as sold
      const { error: updateError } = await supabase
        .from('marketplace_items')
        .update({ status: 'sold' })
        .eq('id', item.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Purchase request submitted successfully'
      });

      fetchMarketplaceItems();
    } catch (error) {
      console.error('Error buying item:', error);
      toast({
        title: 'Error',
        description: 'Failed to process purchase',
        variant: 'destructive'
      });
    }
  };

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favoriteItems);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavoriteItems(newFavorites);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'like_new': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Student Marketplace</h2>
          <p className="text-muted-foreground">
            Buy and sell items with your fellow students
          </p>
        </div>
        <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              List Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>List New Item</DialogTitle>
            </DialogHeader>
            <ProductListingForm 
              onSuccess={() => {
                setShowListingForm(false);
                fetchMarketplaceItems();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map(condition => (
              <SelectItem key={condition} value={condition}>
                {condition === 'all' ? 'All Conditions' : condition.replace('_', ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 p-2"
                onClick={() => toggleFavorite(item.id)}
              >
                <Heart 
                  className={`h-4 w-4 ${
                    favoriteItems.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'
                  }`} 
                />
              </Button>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                  <Badge className={getConditionColor(item.condition)}>
                    {item.condition.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-primary">
                    ₹{item.price}
                  </span>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Seller: {item.seller_name}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => handleBuyItem(item)}
                    className="flex-1"
                    disabled={item.seller_id === profile?.id}
                  >
                    {item.seller_id === profile?.id ? 'Your Item' : 'Buy Now'}
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No items found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default StudentMarketplace;
