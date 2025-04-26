
import React, { useState, useEffect, useCallback } from 'react';
import { useUserMemory } from '@/hooks/useUserMemory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  X, 
  Plus, 
  Brain,
  Edit,
  Check,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

export default function MemoryManager() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { 
    memoryItems, 
    loading, 
    loadMemoryItems, 
    saveMemoryItem, 
    deleteMemoryItem 
  } = useUserMemory();
  
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  
  // For swipe to delete gesture tracking
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Reset form
  const resetForm = () => {
    setNewTitle('');
    setNewValue('');
  };

  const handleAddMemory = async () => {
    if (!newValue.trim() || !newTitle.trim()) {
      toast.error('Título e valor são obrigatórios');
      return;
    }
    
    setIsAdding(true);
    try {
      const success = await saveMemoryItem(newTitle.trim(), newValue.trim(), 'manual', newTitle.trim());
      if (success) {
        toast.success('Memória adicionada com sucesso');
        resetForm();
        setShowAddForm(false);
        setDrawerOpen(false);
      } else {
        toast.error('Falha ao adicionar memória');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMemory = async (key: string) => {
    const success = await deleteMemoryItem(key);
    if (success) {
      toast.success('Memória excluída com sucesso');
      setSwipingItemId(null);
      setDeleteConfirm(null);
    } else {
      toast.error('Falha ao excluir memória');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMemoryItems();
    setIsRefreshing(false);
    toast.success('Memórias atualizadas');
  };

  // Touch handlers for swipe to delete
  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    setSwipingItemId(itemId);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (itemId: string) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 100;
    
    if (isLeftSwipe && swipingItemId === itemId) {
      setDeleteConfirm(itemId);
      // Haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
    
    setSwipingItemId(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Get swipe position for animation
  const getSwipePosition = (itemId: string): string => {
    if (swipingItemId !== itemId || !touchStart || !touchEnd) return 'translate-x-0';
    
    const distance = touchStart - touchEnd;
    if (distance < 0) return 'translate-x-0'; // Don't allow right swipe
    
    if (distance > 100) {
      return '-translate-x-20';
    }
    
    return `translate-x-[-${distance}px]`;
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-10 px-4 bg-black/10 rounded-xl border border-white/5">
      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-inventu-blue/20 to-inventu-purple/20 flex items-center justify-center mb-4">
        <Brain className="h-8 w-8 text-white/40" />
      </div>
      <p className="text-white/80 font-medium text-lg">
        Nenhuma memória encontrada
      </p>
      <p className="text-sm text-white/50 mt-2 mb-6">
        Inicie uma conversa ou adicione itens manualmente
      </p>
      
      {isMobile ? (
        <Button 
          onClick={() => setDrawerOpen(true)}
          className="bg-white/10 hover:bg-white/15 text-white border border-white/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Memória
        </Button>
      ) : (
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-white/10 hover:bg-white/15 text-white border border-white/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Memória
        </Button>
      )}
    </div>
  );

  // Memory Item Card Component
  const MemoryItemCard = ({ item }: { item: any }) => {
    const isConfirmingDelete = deleteConfirm === item.key_name;
    
    return (
      <div 
        key={item.key_name}
        onTouchStart={(e) => handleTouchStart(e, item.key_name)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => handleTouchEnd(item.key_name)}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          swipingItemId === item.key_name ? getSwipePosition(item.key_name) : "translate-x-0"
        )}
      >
        {/* Delete confirmation overlay */}
        {isConfirmingDelete && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in">
            <div className="text-center px-4">
              <p className="text-white mb-4">Excluir esta memória?</p>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                  className="border-white/20 bg-transparent text-white"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteMemory(item.key_name)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete action revealed on swipe - Removing red background */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-black/40 flex items-center justify-center">
          <Trash2 className="h-6 w-6 text-white/70" />
        </div>
        
        {/* The actual card content */}
        <div 
          className={cn(
            "bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all group",
            isMobile ? "mb-3" : ""
          )}
        >
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-white group-hover:text-inventu-blue transition-colors">
              {item.title}
            </h3>
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteMemory(item.key_name)}
                className="opacity-60 hover:opacity-100 transition-opacity -mt-1 -mr-2"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            )}
          </div>
          <div className="mt-2">
            <p className="text-white/80 text-sm whitespace-pre-wrap">{item.value}</p>
          </div>
          {item.source && item.source !== 'manual' && (
            <div className="text-xs text-white/40 mt-2 flex items-center">
              <span className="w-2 h-2 rounded-full bg-inventu-blue/60 mr-1.5"></span>
              Fonte: {item.source}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
          <div className="h-4 bg-white/10 rounded-full w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded-full w-full"></div>
            <div className="h-3 bg-white/10 rounded-full w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Form for adding new memory
  const AddMemoryForm = () => (
    <div className="space-y-4 bg-black/20 p-5 rounded-xl border border-white/5 relative">
      {!isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddForm(false)}
          className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4 text-white/70" />
        </Button>
      )}
      
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/70">Nova Memória</h3>
        
        <Input
          placeholder="Título da memória"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-inventu-blue/50 transition-all"
        />
        
        <Textarea
          placeholder="Valor ou descrição detalhada"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className={cn(
            "min-h-[100px] bg-white/5 border-white/10 focus:border-inventu-blue/50 transition-all",
            isMobile ? "min-h-[120px]" : ""
          )}
        />
        
        <Button 
          onClick={handleAddMemory} 
          disabled={isAdding || !newTitle.trim() || !newValue.trim()}
          className="w-full bg-gradient-to-r from-inventu-blue to-inventu-purple hover:from-inventu-blue/90 hover:to-inventu-purple/90 transition-all"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4 mr-2" />
          )}
          Adicionar
        </Button>
      </div>
    </div>
  );

  // Desktop version
  if (!isMobile) {
    if (!user) {
      return (
        <Alert className="bg-inventu-dark/50 border border-white/10 text-white">
          <AlertDescription>
            Por favor, faça login para visualizar e gerenciar suas memórias.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="bg-inventu-dark/80 backdrop-blur-lg border-inventu-gray/20 overflow-hidden shadow-lg">
          <div className="px-6 py-5 flex items-center justify-between">
            <h2 className="text-xl font-medium bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Memória do Usuário
            </h2>
            <div className="flex space-x-2">
              {!showAddForm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddForm(true)}
                  className="bg-white/5 hover:bg-white/10 border-white/10"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nova Memória
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="bg-white/5 hover:bg-white/10 border-white/10"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>
            </div>
          </div>
          
          <Separator className="bg-inventu-gray/10" />
          
          <CardContent className="p-6 space-y-5">
            {showAddForm && <AddMemoryForm />}
            
            {loading ? (
              <LoadingSkeleton />
            ) : memoryItems.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin pr-1">
                {memoryItems.map((item) => (
                  <MemoryItemCard key={item.key_name} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile version
  return (
    <div className="space-y-4">
      {!user ? (
        <Alert className="bg-inventu-dark/50 border border-white/10 text-white">
          <AlertDescription>
            Por favor, faça login para visualizar e gerenciar suas memórias.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-400">
              {loading ? "Carregando..." : `${memoryItems.length} ${memoryItems.length === 1 ? 'item' : 'itens'}`}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="text-gray-400 hover:text-white"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Memory list or empty state */}
          {loading ? (
            <LoadingSkeleton />
          ) : memoryItems.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-0 pb-20">
              {memoryItems.map((item) => (
                <MemoryItemCard key={item.key_name} item={item} />
              ))}
            </div>
          )}

          {/* Add memory floating button */}
          <Button
            onClick={() => setDrawerOpen(true)}
            className="fixed right-4 bottom-20 rounded-full shadow-lg bg-gradient-to-r from-inventu-blue to-inventu-purple hover:from-inventu-blue/90 hover:to-inventu-purple/90 h-14 w-14 p-0 flex items-center justify-center z-30"
          >
            <Plus className="h-6 w-6" />
          </Button>

          {/* Bottom drawer for adding memories */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent className="bg-inventu-dark border-t border-white/10 max-h-[85vh]">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 my-3" />
              <DrawerHeader className="px-4 pb-0">
                <DrawerTitle className="text-white text-xl">Nova Memória</DrawerTitle>
                <DrawerDescription className="text-white/60">
                  Adicione um novo item à sua memória
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 py-3">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Título</label>
                    <Input
                      placeholder="Título da memória"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-inventu-blue/50 transition-all h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Conteúdo</label>
                    <Textarea
                      placeholder="Valor ou descrição detalhada"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="min-h-[120px] bg-white/5 border-white/10 focus:border-inventu-blue/50 transition-all"
                    />
                  </div>
                </div>
              </div>
              <DrawerFooter className="px-4 pt-0 pb-6">
                <Button 
                  onClick={handleAddMemory}
                  disabled={isAdding || !newTitle.trim() || !newValue.trim()}
                  className="w-full bg-gradient-to-r from-inventu-blue to-inventu-purple hover:from-inventu-blue/90 hover:to-inventu-purple/90 transition-all h-12 text-base"
                >
                  {isAdding ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 mr-2" />
                  )}
                  Adicionar Memória
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setDrawerOpen(false);
                  }}
                  className="border-white/10 text-white/70 hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  );
}
