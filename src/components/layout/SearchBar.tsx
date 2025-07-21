
import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, User, BookOpen, Calendar, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'assignment' | 'event' | 'user' | 'document';
  url?: string;
  metadata?: Record<string, any>;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Computer Science 101',
    description: 'Introduction to Programming',
    type: 'course',
    url: '/courses/cs101'
  },
  {
    id: '2',
    title: 'Assignment: Data Structures',
    description: 'Due: Tomorrow',
    type: 'assignment',
    url: '/assignments/ds-001'
  },
  {
    id: '3',
    title: 'Career Fair 2024',
    description: 'March 15, 2024 - Main Hall',
    type: 'event',
    url: '/events/career-fair-2024'
  },
  {
    id: '4',
    title: 'Dr. John Smith',
    description: 'Computer Science Department',
    type: 'user',
    url: '/profile/john-smith'
  }
];

const getTypeIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'course':
      return BookOpen;
    case 'assignment':
      return FileText;
    case 'event':
      return Calendar;
    case 'user':
      return User;
    case 'document':
      return FileText;
    default:
      return Search;
  }
};

const getTypeColor = (type: SearchResult['type']) => {
  switch (type) {
    case 'course':
      return 'bg-role-teacher/20 text-role-teacher';
    case 'assignment':
      return 'bg-role-student/20 text-role-student';
    case 'event':
      return 'bg-role-alumni/20 text-role-alumni';
    case 'user':
      return 'bg-role-parent/20 text-role-parent';
    case 'document':
      return 'bg-role-admin/20 text-role-admin';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search courses, assignments, events...",
  onSearch,
  onResultSelect,
  className
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      // Simulate search API call
      const filteredResults = mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    onResultSelect?.(result);
    
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [result.title, ...prev.filter(item => item !== result.title)];
      return updated.slice(0, 5);
    });
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    onSearch?.(search);
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 bg-background/50 backdrop-blur-sm border-white/10 focus:border-white/20"
        />
      </div>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto bg-background/95 backdrop-blur-sm border-white/10">
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Recent Searches
              </h4>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-white/5 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((result) => {
                const Icon = getTypeIcon(result.type);
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <div className={cn("p-2 rounded-lg", getTypeColor(result.type))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{result.title}</div>
                      <div className="text-xs text-muted-foreground">{result.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {result.type}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}

          {query.length > 0 && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
