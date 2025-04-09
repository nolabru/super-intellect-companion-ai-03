
import React from 'react';
import { CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GalleryFilters as FiltersType } from '@/pages/MediaGallery';
import { cn } from '@/lib/utils';

type GalleryFiltersProps = {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
};

const mediaTypes = [
  { value: 'image', label: 'Imagens' },
  { value: 'audio', label: 'Áudios' },
  { value: 'video', label: 'Vídeos' },
];

const GalleryFilters: React.FC<GalleryFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleMediaTypeToggle = (type: string) => {
    let newTypes: string[];
    
    if (filters.mediaType.includes(type)) {
      newTypes = filters.mediaType.filter(t => t !== type);
    } else {
      newTypes = [...filters.mediaType, type];
    }
    
    onFiltersChange({
      ...filters,
      mediaType: newTypes,
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        from: date,
      },
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        to: date,
      },
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      mediaType: [],
      dateRange: { from: undefined, to: undefined },
    });
  };

  const hasActiveFilters = filters.mediaType.length > 0 || 
                           filters.dateRange.from !== undefined || 
                           filters.dateRange.to !== undefined;

  return (
    <div className="bg-inventu-card p-4 rounded-lg mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-white font-medium">Filtros</h2>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
          >
            Limpar filtros
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-sm text-inventu-gray mb-2">Tipo de mídia</p>
          <div className="flex flex-wrap gap-2">
            {mediaTypes.map(type => (
              <Button
                key={type.value}
                variant={filters.mediaType.includes(type.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleMediaTypeToggle(type.value)}
                className={filters.mediaType.includes(type.value) 
                  ? "bg-inventu-blue hover:bg-inventu-blue/80" 
                  : "border-inventu-gray/30 text-inventu-gray hover:text-white"}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div>
            <p className="text-sm text-inventu-gray mb-2">Data inicial</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-inventu-gray/30 text-inventu-gray hover:text-white justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    format(filters.dateRange.from, "PPP", { locale: ptBR })
                  ) : (
                    "Selecionar data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from}
                  onSelect={handleDateFromChange}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <p className="text-sm text-inventu-gray mb-2">Data final</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-inventu-gray/30 text-inventu-gray hover:text-white justify-start text-left font-normal",
                    !filters.dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.to ? (
                    format(filters.dateRange.to, "PPP", { locale: ptBR })
                  ) : (
                    "Selecionar data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to}
                  onSelect={handleDateToChange}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryFilters;
