
import React from 'react';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GalleryFilters as FiltersType } from '@/pages/MediaGallery';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

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
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = React.useState(false);
  
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
    if (!isDesktop) {
      setOpen(false);
    }
  };

  const hasActiveFilters = 
    (filters.mediaType.length > 0 && !isDefaultFilter(filters.mediaType)) || 
    filters.dateRange.from !== undefined || 
    filters.dateRange.to !== undefined;
    
  // Check if the current filter is just the default (images only)
  function isDefaultFilter(mediaTypes: string[]): boolean {
    return mediaTypes.length === 1 && mediaTypes[0] === 'image';
  }

  const renderFiltersContent = () => (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Tipo de mídia</h3>
          <div className="flex flex-wrap gap-2">
            {mediaTypes.map(type => (
              <Button
                key={type.value}
                variant={filters.mediaType.includes(type.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleMediaTypeToggle(type.value)}
                className={cn(
                  "rounded-xl h-10 transition-all duration-200",
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
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Data inicial</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl h-10",
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
              <PopoverContent className="w-auto p-0 border-white/10 bg-inventu-card" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from}
                  onSelect={handleDateFromChange}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Data final</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl h-10",
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
              <PopoverContent className="w-auto p-0 border-white/10 bg-inventu-card" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to}
                  onSelect={handleDateToChange}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <Button 
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full justify-center text-white hover:text-white hover:bg-white/10"
          >
            Limpar todos os filtros
          </Button>
        </div>
      )}
    </>
  );

  // Use Sheet for desktop, Drawer for mobile
  if (isDesktop) {
    return (
      <div className="bg-inventu-card/50 backdrop-blur-xl p-4 rounded-2xl mb-4 mx-4 border border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-white font-medium flex items-center">
            <FilterIcon className="h-4 w-4 mr-2" />
            Filtros
          </h2>
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
        
        {renderFiltersContent()}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 px-4 pb-3 pt-1 bg-inventu-darker/80 backdrop-blur-xl">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-11 justify-between border-white/10 bg-white/5"
          >
            <span className="flex items-center">
              <FilterIcon className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 bg-white text-black text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                  {(filters.mediaType.length > 0 && !isDefaultFilter(filters.mediaType) ? 1 : 0) + 
                   (filters.dateRange.from ? 1 : 0) + 
                   (filters.dateRange.to ? 1 : 0)}
                </span>
              )}
            </span>
            <span className="text-xs text-inventu-gray/70">
              {hasActiveFilters ? "Filtros ativos" : "Sem filtros"}
            </span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-inventu-darker border-t border-white/10">
          <div className="px-4 py-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-white mb-6">Filtros da Galeria</h2>
            {renderFiltersContent()}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default GalleryFilters;
