
import { useState, useEffect, useCallback } from 'react';

export const BREAKPOINTS = {
  sm: 640,   // Small screens
  md: 768,   // Medium screens
  lg: 1024,  // Large screens
  xl: 1280,  // Extra large screens
  '2xl': 1536 // 2x Extra large screens
};

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Hook to determine if the current viewport is smaller than a specific breakpoint
 * @param breakpoint The breakpoint to check against (default: 'md')
 * @returns boolean indicating if the viewport is smaller than the breakpoint
 */
export function useIsMobile(breakpoint: Breakpoint = 'md'): boolean {
  const breakpointValue = BREAKPOINTS[breakpoint];

  const checkIsMobile = useCallback(() => {
    return typeof window !== 'undefined' ? window.innerWidth < breakpointValue : false;
  }, [breakpointValue]);

  const [isMobile, setIsMobile] = useState<boolean>(checkIsMobile());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener with passive option for better performance
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [checkIsMobile]);

  return isMobile;
}

/**
 * Hook to get the current screen size category based on Tailwind's breakpoints
 * @returns The current screen size category: 'xs', 'sm', 'md', 'lg', 'xl', or '2xl'
 */
export function useScreenSize(): Breakpoint | 'xs' {
  const [screenSize, setScreenSize] = useState<Breakpoint | 'xs'>('md');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const determineScreenSize = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.sm) return 'xs';
      if (width < BREAKPOINTS.md) return 'sm';
      if (width < BREAKPOINTS.lg) return 'md';
      if (width < BREAKPOINTS.xl) return 'lg';
      if (width < BREAKPOINTS['2xl']) return 'xl';
      return '2xl';
    };
    
    const handleResize = () => {
      setScreenSize(determineScreenSize());
    };
    
    // Set initial size
    handleResize();
    
    // Add event listener with passive option
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return screenSize;
}
