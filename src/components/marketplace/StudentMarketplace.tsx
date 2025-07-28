
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Star, Filter, ShoppingCart, User, Calendar, MapPin } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import ProductListingForm from './ProductListingForm';
import ProductCard from './ProductCard';
import PaymentModal from './PaymentModal';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  images: string[];
  seller_id: string;
  seller_name: string;
  seller_rating: number;
  college_id: string;
  status: 'active' | 'sold' | 'reserved';
  created_at: string;
  updated_at: string;
}

const StudentMarketplace = () => {
  const { profile } = useUserProfile();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showListingForm, setShowListingForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'books', label: 'Books & Notes' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'services', label: 'Services' },
    { value: 'tickets', label: 'Event Tickets' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadMarketplaceItems();
  }, [profile]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadMarketplaceItems = async () => {
    if (!profile?.college_id) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          seller:user_profiles!seller_id(
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('college_id', profile.college_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems: MarketplaceItem[] = data.map(item => ({
        ...item,
        seller_name: `${item.seller.first_name} ${item.seller.last_name}`,
        seller_rating: 4.5 // TODO: Implement rating system
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error loading marketplace items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handlePurchase = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from('marketplace_transactions')
        .insert({
          item_id: selectedItem.id,
          buyer_id: profile?.id,
          seller_id: selectedItem.seller_id,
          amount: selectedItem.price,
          status: 'completed',
          college_id: profile?.college_id
        });

      if (error) throw error;

      // Update item status to sold
      await supabase
        .from('marketplace_items')
        .update({ status: 'sold' })
        .eq('id', selectedItem.id);

      toast({
        title: 'Purchase Successful',
        description: 'Your purchase has been completed successfully!'
      });

      setShowPaymentModal(false);
      setSelectedItem(null);
      loadMarketplaceItems();
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast({
        title: 'Error',
        description: 'Failed to process purchase',
        variant: 'destructive'
      });
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell items within your college community</p>
        </div>
        <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>List Item</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Listing</DialogTitle>
            </DialogHeader>
            <ProductListingForm 
              onSuccess={() => {
                setShowListingForm(false);
                loadMarketplaceItems();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Sellers</p>
                <p className="text-2xl font-bold">{new Set(items.map(item => item.seller_id)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">New Today</p>
                <p className="text-2xl font-bold">
                  {items.filter(item => 
                    new Date(item.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <ProductCard
            key={item.id}
            item={item}
            onPurchase={handlePurchase}
            isOwner={item.seller_id === profile?.id}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Be the first to list an item in the marketplace!'
            }
          </p>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        item={selectedItem}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default StudentMarketplace;
