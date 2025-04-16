
import React, { useState } from 'react';
import { useUserMemory } from '@/hooks/useUserMemory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        
        <Separator className="bg-inventu-gray/10" />
        
        <CardContent className="p-6 space-y-5">
          <div className="space-y-4 bg-black/20 p-5 rounded-xl border border-white/5">
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
                className="min-h-[100px] bg-white/5 border-white/10 focus:border-inventu-blue/50 transition-all"
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
          
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-inventu-blue" />
            </div>
          ) : memoryItems.length === 0 ? (
            <div className="text-center py-8 px-4 bg-black/10 rounded-xl border border-white/5">
              <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <PlusCircle className="h-6 w-6 text-white/40" />
              </div>
              <p className="text-white/60 font-medium">
                Nenhuma memória encontrada
              </p>
              <p className="text-sm text-white/40 mt-1">
                Inicie uma conversa ou adicione itens manualmente
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-thin pr-1">
              {memoryItems.map((item) => (
                <div 
                  key={item.key_name} 
                  className="bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-white group-hover:text-inventu-blue transition-colors">
                      {item.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMemory(item.key_name)}
                      className="opacity-60 hover:opacity-100 transition-opacity -mt-1 -mr-2"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
