
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, CheckCircle2, Clock } from 'lucide-react';

interface CacheStatusIndicatorProps {
  isCached: boolean;
  isStale?: boolean;
}

const CacheStatusIndicator: React.FC<CacheStatusIndicatorProps> = ({
  isCached,
  isStale = false
}) => {
  if (!isCached) {
    return null;
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="flex items-center gap-1">
          {isStale ? (
            <>
              <Clock className="h-3 w-3" />
              <span>Cached (stale)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3" />
              <span>From Cache</span>
            </>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {isStale 
          ? 'Using cached content that might be outdated'
          : 'Content retrieved from local cache for instant access'}
      </TooltipContent>
    </Tooltip>
  );
};

export default CacheStatusIndicator;
