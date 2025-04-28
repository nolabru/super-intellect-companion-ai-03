
import { useState, useEffect } from 'react';

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    // Feature detection for touch events
    const checkTouch = (): boolean => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for IE specific check
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
      );
    };

    // Set initial value
    setIsTouchDevice(checkTouch());

    // Create event listener for device orientation changes
    // Sometimes when rotating devices, touch capabilities might change
    const handleOrientationChange = () => {
      setIsTouchDevice(checkTouch());
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return isTouchDevice;
}
