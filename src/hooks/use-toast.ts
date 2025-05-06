
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// Map to track active toasts by content hash
const activeToastsByContent = new Map<string, string>();
let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// Generate a unique content hash for a toast
const generateContentHash = (toast: Partial<ToasterToast>): string => {
  const titleStr = typeof toast.title === 'string' ? toast.title : '';
  const descStr = typeof toast.description === 'string' ? toast.description : '';
  const variantStr = toast.variant || 'default';
  return `${titleStr}|${descStr}|${variantStr}`;
}

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

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

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

  const id = genId()

  // Register this toast in the content map
  if (contentHash) {
    activeToastsByContent.set(contentHash, id);
  }

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
    
  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id })
    
    // Remove from the map when explicitly dismissed
    if (contentHash) {
      activeToastsByContent.delete(contentHash);
    }
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
