
import React, { useState } from 'react';
import { useUserMemory } from '@/hooks/useUserMemory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddMemory = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast.error('Both key and value must be provided');
      return;
    }
    
    setIsAdding(true);
    try {
      const success = await saveMemoryItem(newKey.trim(), newValue.trim(), 'manual');
      if (success) {
        toast.success('Memory item added successfully');
        setNewKey('');
        setNewValue('');
      } else {
        toast.error('Failed to add memory item');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMemory = async (key: string) => {
    const success = await deleteMemoryItem(key);
    if (success) {
      toast.success('Memory item deleted successfully');
    } else {
      toast.error('Failed to delete memory item');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMemoryItems();
    setIsRefreshing(false);
    toast.success('Memory items refreshed');
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-gray-500">
        Please sign in to view and manage your memory items.
      </div>
    );
  }

  return (
    <div className="p-4 bg-inventu-dark rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">User Memory</h2>
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
          Refresh
        </Button>
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Key (e.g., name, location)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Value (e.g., John, New York)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleAddMemory} 
            disabled={isAdding || !newKey.trim() || !newValue.trim()}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Add
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-inventu-blue" />
          </div>
        ) : memoryItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No memory items found. Start a conversation or add items manually.
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {memoryItems.map((item) => (
              <div 
                key={item.key_name} 
                className="flex items-center justify-between bg-inventu-gray/10 p-3 rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-inventu-blue">{item.key_name}:</span>
                    <span className="ml-2 text-white">{item.value}</span>
                  </div>
                  {item.source && (
                    <div className="text-xs text-gray-400 mt-1">
                      Source: {item.source}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMemory(item.key_name)}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
