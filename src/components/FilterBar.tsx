import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  skinTone: string;
  onSkinToneChange: (tone: string) => void;
  style: string;
  onStyleChange: (style: string) => void;
  activeFilters: Array<{ key: string; label: string; value: string }>;
  onRemoveFilter: (key: string) => void;
}

const FilterBar = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  skinTone,
  onSkinToneChange,
  style,
  onStyleChange,
  activeFilters,
  onRemoveFilter,
}: FilterBarProps) => {
  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subscribers-desc">Subscribers: High to Low</SelectItem>
              <SelectItem value="subscribers-asc">Subscribers: Low to High</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>

          <Select value={skinTone} onValueChange={onSkinToneChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Skin Tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skin Tones</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="tan">Tan</SelectItem>
              <SelectItem value="deep">Deep</SelectItem>
            </SelectContent>
          </Select>

          <Select value={style} onValueChange={onStyleChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="natural">Natural</SelectItem>
              <SelectItem value="glam">Glam</SelectItem>
              <SelectItem value="editorial">Editorial</SelectItem>
              <SelectItem value="soft">Soft & Romantic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="gap-1">
              {filter.label}: {filter.value}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => onRemoveFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
