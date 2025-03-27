import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { FilterState } from "../types";

interface FilterPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterState: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onResetFilters: () => void;
}

export default function FilterPopover({
  open,
  onOpenChange,
  filterState,
  onFilterChange,
  onResetFilters
}: FilterPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`text-xs ${open ? 'bg-amber-900/20 text-amber-400 border-amber-800' : ''}`}
        >
          <Filter size={14} className="mr-1" />
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-gray-900 border border-amber-500/20" side="bottom" align="end">
        <h3 className="font-medium text-amber-400 mb-3">Filter Transactions</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search" className="text-sm text-gray-400">Search</Label>
            <Input
              id="search"
              placeholder="Search addresses, values..."
              value={filterState.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm text-gray-400">Status</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.keys(filterState.statusFilter).map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filterState.statusFilter[status]}
                    onCheckedChange={(checked) => {
                      onFilterChange('statusFilter', {
                        ...filterState.statusFilter,
                        [status]: !!checked
                      });
                    }}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-value" className="text-sm text-gray-400">Min Value</Label>
              <Input
                id="min-value"
                placeholder="ETH"
                value={filterState.valueMin}
                onChange={(e) => onFilterChange('valueMin', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-value" className="text-sm text-gray-400">Max Value</Label>
              <Input
                id="max-value"
                placeholder="ETH"
                value={filterState.valueMax}
                onChange={(e) => onFilterChange('valueMax', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button 
              variant="outline"
              className="mr-2 border-gray-700 text-gray-400"
              onClick={onResetFilters}
            >
              Reset
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white" 
              onClick={() => onOpenChange(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
