
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface MediaContextValue {
  selectedMedia: string | null;
  setSelectedMedia: (url: string | null) => void;
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined);

export const MediaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  return (
    <MediaContext.Provider value={{ selectedMedia, setSelectedMedia }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = (): MediaContextValue => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};
