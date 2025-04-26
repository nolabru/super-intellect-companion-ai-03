
import React, { useState } from 'react';
import { useUserMemory } from '@/hooks/useUserMemory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit2, Trash2, Plus, Brain, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<{
    key: string;
    title: string;
    value: string;
  } | null>(null);

  // Reset form
  const resetForm = () => {
    setNewTitle('');
    setNewValue('');
  };

  // Handle memory save/update
  const handleSaveMemory = async () => {
    if (!newValue.trim() || !newTitle.trim()) {
      toast.error('Título e valor são obrigatórios');
      return;
    }
    
    setIsAdding(true);
    try {
      const success = editingMemory 
        ? await saveMemoryItem(editingMemory.key, newValue.trim(), 'manual', newTitle.trim()) 
        : await saveMemoryItem(newTitle.trim(), newValue.trim(), 'manual', newTitle.trim());
      
      if (success) {
        toast.success(editingMemory ? 'Memória atualizada com sucesso' : 'Memória adicionada com sucesso');
        resetForm();
        setShowAddForm(false);
        setDrawerOpen(false);
        setEditingMemory(null);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRefresh = async () => {
    await loadMemoryItems();
    toast.success('Memórias atualizadas');
  };

  // Memory item card component
  const MemoryItemCard = ({ item }: { item: any }) => {
    const startEditing = () => {
      setEditingMemory({
        key: item.key_name,
        title: item.title,
        value: item.value
      });
      setNewTitle(item.title);
      setNewValue(item.value);
      
      if (isMobile) {
        setDrawerOpen(true);
      } else {
        setShowAddForm(true);
      }
    };

    return (
      <div className="bg-black/20 backdrop-blur-sm border border-white/5 rounded-lg p-4 mb-3 hover:border-white/10 transition-all group">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-white/90 group-hover:text-white transition-colors">
            {item.title}
          </h3>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={startEditing}
              className="h-8 w-8 opacity-60 hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-4 w-4 text-white/70" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMemoryItem(item.key_name)}
              className="h-8 w-8 opacity-60 hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-white/70 text-sm whitespace-pre-wrap">{item.value}</p>
        </div>
        
        {item.source && item.source !== 'manual' && (
          <div className="flex items-center mt-2 gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
            <span className="text-xs text-white/40">
              Fonte: {item.source}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12 px-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
        <Brain className="h-8 w-8 text-white/40" />
      </div>
      <p className="text-white/90 font-medium text-lg mb-2">
        Nenhuma memória encontrada
      </p>
      <p className="text-sm text-white/50 mb-6">
        Inicie uma conversa ou adicione itens manualmente
      </p>
      
      <Button 
        onClick={() => isMobile ? setDrawerOpen(true) : setShowAddForm(true)}
        variant="secondary"
        className="bg-white/5 hover:bg-white/10 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Memória
      </Button>
    </div>
  );

  // Loading state component
  const LoadingState = () => (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="bg-black/20 p-4 rounded-lg border border-white/5">
          <div className="h-4 bg-white/10 rounded-full w-1/3 mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded-full w-full" />
            <div className="h-3 bg-white/10 rounded-full w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!user) {
    return (
      <Alert className="bg-black/20 border border-white/10 text-white">
        <AlertDescription>
          Por favor, faça login para visualizar e gerenciar suas memórias.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-white/50">
          {loading ? "Carregando..." : `${memoryItems.length} ${memoryItems.length === 1 ? 'item' : 'itens'}`}
        </p>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleRefresh}
          className="text-white/50 hover:text-white"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {loading ? (
        <LoadingState />
      ) : memoryItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3 pb-20">
          {memoryItems.map((item) => (
            <MemoryItemCard key={item.key_name} item={item} />
          ))}
        </div>
      )}

      {/* Add memory floating button for mobile */}
      {isMobile && (
        <Button
          onClick={() => setDrawerOpen(true)}
          className="fixed right-4 bottom-20 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 h-14 w-14 p-0 flex items-center justify-center z-30"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Bottom drawer for adding memories */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-inventu-dark border-t border-white/10">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 my-3" />
          <DrawerHeader>
            <DrawerTitle className="text-white">
              {editingMemory ? 'Editar Memória' : 'Nova Memória'}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 py-3 space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Título da memória"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-blue-500/50 h-12"
              />
              
              <Textarea
                placeholder="Valor ou descrição detalhada"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="min-h-[120px] bg-white/5 border-white/10 focus:border-blue-500/50"
              />
            </div>
          </div>
          
          <DrawerFooter className="px-4 pb-6">
            <Button 
              onClick={handleSaveMemory}
              disabled={isAdding || !newTitle.trim() || !newValue.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 h-12 text-base"
            >
              {isAdding ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              {editingMemory ? 'Atualizar' : 'Adicionar'}
            </Button>
            
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setEditingMemory(null);
                }}
                className="w-full border-white/10 text-white/70 hover:bg-white/10"
              >
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
