
import React from 'react';
import { CalendarIcon } from 'lucide-react';
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
      // Não permitir desmarcar o último filtro selecionado
      if (filters.mediaType.length === 1) {
        return;
      }
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
      mediaType: ['image'], // Default to images when clearing filters
      dateRange: { from: undefined, to: undefined },
    });
  };

  const hasActiveFilters = 
    (filters.mediaType.length > 0 && !isDefaultFilter(filters.mediaType)) || 
    filters.dateRange.from !== undefined || 
    filters.dateRange.to !== undefined;
    
  // Check if the current filter is just the default (images only)
  function isDefaultFilter(mediaTypes: string[]): boolean {
    return mediaTypes.length === 1 && mediaTypes[0] === 'image';
  }

  return (
    <div className="bg-inventu-card/50 backdrop-blur-xl p-4 rounded-2xl mb-4 mx-4 border border-white/5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-white font-medium">Filtros</h2>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-white hover:text-white hover:bg-white/5"
          >
            Limpar filtros
          </Button>
        )}
      </div>
      
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-white mb-3">Tipo de mídia</p>
          <div className="flex flex-wrap gap-2">
            {mediaTypes.map(type => (
              <Button
                key={type.value}
                variant={filters.mediaType.includes(type.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleMediaTypeToggle(type.value)}
                className={cn(
                  "rounded-xl transition-all duration-200",
                  filters.mediaType.includes(type.value) 
                    ? "bg-white text-black hover:bg-white/90" 
                    : "border-white/10 text-white hover:text-white hover:bg-white/10"
                )}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-white mb-3">Data inicial</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl",
                    "border-white/10 bg-white/5 hover:bg-white/10",
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
          
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-white mb-3">Data final</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl",
                    "border-white/10 bg-white/5 hover:bg-white/10",
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
