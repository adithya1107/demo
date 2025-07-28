
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, User, ShoppingCart } from 'lucide-react';

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

interface ProductCardProps {
  item: MarketplaceItem;
  onPurchase: (item: MarketplaceItem) => void;
  isOwner: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, onPurchase, isOwner }) => {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-500';
      case 'like_new': return 'bg-blue-500';
      case 'good': return 'bg-yellow-500';
      case 'fair': return 'bg-orange-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={item.images[0] || '/placeholder.svg'}
            alt={item.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge className={getConditionColor(item.condition)}>
              {item.condition.replace('_', ' ')}
            </Badge>
          </div>
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-white/90">
              {item.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">₹{item.price}</span>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{item.seller_rating}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{item.seller_name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTimeAgo(item.created_at)}</span>
            </div>
          </div>
          
          <div className="pt-2">
            {isOwner ? (
              <Button variant="outline" className="w-full" disabled>
                Your Listing
              </Button>
            ) : (
              <Button 
                onClick={() => onPurchase(item)} 
                className="w-full"
                disabled={item.status !== 'active'}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {item.status === 'active' ? 'Purchase' : 'Sold'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
