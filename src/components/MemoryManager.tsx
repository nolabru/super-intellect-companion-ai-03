import React, { useState } from 'react';
import { useUserMemory } from '@/hooks/useUserMemory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function MemoryManager() {
  const { user } = useAuth();
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        setNewTitle('');
        setNewValue('');
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

  if (!user) {
    return (
      <div className="text-center py-4 text-gray-500">
        Por favor, faça login para visualizar e gerenciar suas memórias.
      </div>
    );
  }

  return (
    <div className="p-4 bg-inventu-dark rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Memória do Usuário</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-4">
        <div className="grid gap-3">
          <Input
            placeholder="Título da memória"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full"
          />
          <Textarea
            placeholder="Valor ou descrição detalhada"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full min-h-[100px]"
          />
          <Button 
            onClick={handleAddMemory} 
            disabled={isAdding || !newTitle.trim() || !newValue.trim()}
            className="w-full"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Adicionar
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-inventu-blue" />
          </div>
        ) : memoryItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Nenhuma memória encontrada. Inicie uma conversa ou adicione itens manualmente.
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {memoryItems.map((item) => (
              <div 
                key={item.key_name} 
                className="flex flex-col bg-inventu-gray/10 p-3 rounded"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-inventu-blue text-lg">{item.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMemory(item.key_name)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
                <div className="mt-1">
                  <p className="text-white mt-1 whitespace-pre-wrap">{item.value}</p>
                </div>
                {item.source && (
                  <div className="text-xs text-gray-400 mt-2">
                    Fonte: {item.source}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
