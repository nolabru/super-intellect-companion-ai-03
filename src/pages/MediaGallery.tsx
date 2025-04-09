
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useMediaGallery, MediaItem } from "@/hooks/useMediaGallery";
import { SearchIcon, CalendarIcon, Image, Video, AudioLines, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MediaGallery: React.FC = () => {
  const { 
    mediaItems, 
    loading, 
    error, 
    filters, 
    setFilters, 
    fetchMediaItems,
    deleteMediaItem
  } = useMediaGallery();
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = mediaItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(mediaItems.length / itemsPerPage);
  
  // Reset to page 1 when filters change
  const handleFilterChange = (newFilters: typeof filters) => {
    setCurrentPage(1);
    setFilters(newFilters);
  };
  
  // Handle media preview
  const handlePreviewMedia = (item: MediaItem) => {
    window.open(item.media_url, '_blank');
  };
  
  // Handle media deletion
  const handleDeleteMedia = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirm('Tem certeza que deseja excluir este item da galeria?')) {
      const success = await deleteMediaItem(id);
      if (success) {
        // If current page is now empty due to deletion, go back one page
        if (currentItems.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      mediaType: '',
      startDate: null,
      endDate: null,
      searchQuery: '',
    });
  };
  
  // Get appropriate icon for media type
  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <Video size={20} />;
      case 'audio':
        return <AudioLines size={20} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Galeria de Mídia</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Filter controls */}
      <div className="bg-inventu-card rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Media Type Filter */}
          <div>
            <Label htmlFor="mediaType">Tipo de Mídia</Label>
            <Select
              value={filters.mediaType}
              onValueChange={(value: 'image' | 'video' | 'audio' | '') => 
                handleFilterChange({...filters, mediaType: value})}
            >
              <SelectTrigger id="mediaType">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="image">Imagens</SelectItem>
                <SelectItem value="video">Vídeos</SelectItem>
                <SelectItem value="audio">Áudios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Start Date Filter */}
          <div>
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy') : 'Selecionar...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate || undefined}
                  onSelect={(date) => handleFilterChange({...filters, startDate: date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* End Date Filter */}
          <div>
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy') : 'Selecionar...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate || undefined}
                  onSelect={(date) => handleFilterChange({...filters, endDate: date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Search Filter */}
          <div>
            <Label htmlFor="searchQuery">Buscar por Prompt</Label>
            <div className="relative">
              <Input
                id="searchQuery"
                type="text"
                placeholder="Digite para buscar..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange({...filters, searchQuery: e.target.value})}
                className="pl-8"
              />
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={resetFilters} className="mr-2">
            Limpar Filtros
          </Button>
          <Button onClick={() => fetchMediaItems()}>
            Atualizar
          </Button>
        </div>
      </div>
      
      {/* Media Items Table */}
      <div className="bg-inventu-card rounded-lg overflow-hidden">
        <Table>
          <TableCaption>
            {loading ? 'Carregando mídia...' : 
             mediaItems.length === 0 ? 'Nenhum item de mídia encontrado' : 
             `Total de ${mediaItems.length} itens de mídia`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="w-[40%]">Prompt</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="mt-2">Carregando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Nenhum item de mídia encontrado com os filtros atuais
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((item) => (
                <TableRow 
                  key={item.id} 
                  className="cursor-pointer hover:bg-muted/70"
                  onClick={() => handlePreviewMedia(item)}
                >
                  <TableCell>
                    <div className="flex items-center">
                      {getMediaTypeIcon(item.media_type)}
                      <span className="ml-2 capitalize">{item.media_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="truncate max-w-xs">
                    {item.prompt}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewMedia(item);
                        }}
                      >
                        <ExternalLink size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={(e) => handleDeleteMedia(item.id, e)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 border-t border-gray-800">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={currentPage === index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
