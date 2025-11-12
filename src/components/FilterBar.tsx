import { Search, SlidersHorizontal } from "lucide-react";
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

const FilterBar = () => {
  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, style, or brand..."
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3">
          <Select defaultValue="all">
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

          <Select defaultValue="all">
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

          <Button variant="outline" size="icon">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Active filters:</span>
        <Badge variant="secondary" className="gap-1">
          Subscribers: 100K+
          <button className="ml-1 hover:text-destructive">×</button>
        </Badge>
        <Badge variant="secondary" className="gap-1">
          Engagement: High
          <button className="ml-1 hover:text-destructive">×</button>
        </Badge>
      </div>
    </div>
  );
};

export default FilterBar;
