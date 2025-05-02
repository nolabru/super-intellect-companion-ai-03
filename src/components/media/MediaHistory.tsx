
import React from 'react';
import { useMediaContext } from '@/contexts/MediaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Clock, Trash } from 'lucide-react';

const MediaHistory: React.FC = () => {
  const { state, clearTask } = useMediaContext();
  
  // Get recent tasks sorted by creation time
  const recentTasks = state.recentTasks
    .map(id => state.tasks[id])
    .filter(Boolean);
  
  if (recentTasks.length === 0) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Recent Generations
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px] overflow-y-auto">
          <div className="space-y-1">
            {recentTasks.map(task => (
              <div 
                key={task.id} 
                className="flex items-center gap-2 p-3 hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {task.prompt || 'No prompt'}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span>{task.type}</span>
                    <span>•</span>
                    <span>{task.model}</span>
                    <span>•</span>
                    <span>
                      {task.status === 'completed' ? 'Completed' :
                       task.status === 'failed' ? 'Failed' :
                       task.status === 'canceled' ? 'Canceled' :
                       'Processing'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => clearTask(task.id)}
                    title="Remove from history"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MediaHistory;
