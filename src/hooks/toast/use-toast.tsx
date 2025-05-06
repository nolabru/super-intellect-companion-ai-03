
import * as React from "react";
import {
  ToasterToast,
  State,
} from "./toast-types";
import { 
  genId,
  addToRemoveQueue,
  activeToastsByContent,
  generateContentHash
} from "./toast-manager";
import { dispatch, listeners, memoryState } from "./toast-store";

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  // Generate a content hash for deduplication
  const contentHash = generateContentHash(props);
  
  if (contentHash && activeToastsByContent.has(contentHash)) {
    // If a toast with the same content exists, don't create a new one
    console.log('[Toast] Preventing duplicate toast:', contentHash);
    return {
      id: activeToastsByContent.get(contentHash) || '',
      dismiss: () => {},
      update: () => {},
    };
  }

  const id = genId();

  // Register this toast in the content map
  if (contentHash) {
    activeToastsByContent.set(contentHash, id);
  }

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
    
  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
    
    // Remove from the map when explicitly dismissed
    if (contentHash) {
      activeToastsByContent.delete(contentHash);
    }
  };

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
