
import { State, Action, actionTypes, TOAST_REMOVE_DELAY, TOAST_LIMIT } from "./toast-types";
import { addToRemoveQueue } from "./toast-manager";

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id
            ? { ...t, ...action.toast }
            : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // Only dismiss if the toast actually exists
      if (toastId === undefined) {
        // All toasts
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
        
        return {
          ...state,
          toasts: state.toasts.map((t) => ({
            ...t,
            open: false,
          })),
        }
      }
      
      // Individual toast
      addToRemoveQueue(toastId)
      
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, open: false } : t
        ),
      }
    }
    
    case actionTypes.REMOVE_TOAST: {
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    }
  }
}
