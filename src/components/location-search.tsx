'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { useCollection, useMemoSupabase } from '@/supabase';
import { type Category } from '@/lib/categories';
import { cn } from '@/lib/utils';

export type SearchFilters = {
  query: string;
  category: string;
  tags: string[];
  minRating: number;
  placeId?: string;
};

type LocationSearchProps = {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags?: string[];
  placeId?: string;
  className?: string;
};

export function LocationSearch({
  filters,
  onFiltersChange,
  availableTags = [],
  placeId,
  className,
}: LocationSearchProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');

  // Fetch categories
  const categoriesQuery = useMemoSupabase(() => ({
    table: 'categories',
    filter: (query: any) => query.order('name', { ascending: true }),
    __memo: true,
  }), []);
  const { data: categoriesData } = useCollection<any>(categoriesQuery);
  const categories: Category[] | null = categoriesData
    ? categoriesData.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
    : null;

  const handleQueryChange = (value: string) => {
    onFiltersChange({ ...filters, query: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value });
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !filters.tags.includes(trimmed)) {
      onFiltersChange({ ...filters, tags: [...filters.tags, trimmed] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter(t => t !== tagToRemove),
    });
  };

  const handleMinRatingChange = (value: string) => {
    onFiltersChange({ ...filters, minRating: parseInt(value) || 0 });
  };

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      category: '',
      tags: [],
      minRating: 0,
      placeId: placeId,
    });
  };

  const hasActiveFilters = filters.query || filters.category || filters.tags.length > 0 || filters.minRating > 0;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations by name or description..."
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(isExpanded && 'bg-accent')}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {[filters.category && '1', filters.tags.length, filters.minRating > 0 && '1'].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" onClick={clearFilters} size="sm">
            Clear
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
              <Select
                value={filters.minRating.toString()}
                onValueChange={handleMinRatingChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any rating</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="2">2+ stars</SelectItem>
                  <SelectItem value="1">1+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add a tag filter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </div>
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {availableTags.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Available tags:</p>
                <div className="flex flex-wrap gap-1">
                  {availableTags
                    .filter(tag => !filters.tags.includes(tag.toLowerCase()))
                    .slice(0, 10)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          if (!filters.tags.includes(tag.toLowerCase())) {
                            onFiltersChange({
                              ...filters,
                              tags: [...filters.tags, tag.toLowerCase()],
                            });
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

