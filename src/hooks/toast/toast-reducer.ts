import { Action, State, actionTypes } from "./toast-types"
import { addToRemoveQueue, activeToastsByContent } from "./toast-manager"

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
        
        // Remove from active toasts map if this toast is being closed
        for (const [content, id] of activeToastsByContent.entries()) {
          if (id === toastId) {
            activeToastsByContent.delete(content);
            break;
          }
        }
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
        // Clear active toasts map if all are being closed
        activeToastsByContent.clear();
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // Clear active toasts map if all are being removed
        activeToastsByContent.clear();
        return {
          ...state,
          toasts: [],
        }
      }
      
      // Remove from active toasts map when a toast is removed
      for (const [content, id] of activeToastsByContent.entries()) {
        if (id === action.toastId) {
          activeToastsByContent.delete(content);
          break;
        }
      }
      
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Import constants from toast-types to fix the unknown identifier issue
import { TOAST_LIMIT } from "./toast-types"
