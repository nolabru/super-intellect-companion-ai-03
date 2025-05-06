
import { ToasterToast } from "./toast-types";
import { dispatch } from "./toast-store";

// Toast timeouts management
export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
export const TOAST_REMOVE_DELAY = 5000;

// Map to track active toasts by content hash
export const activeToastsByContent = new Map<string, string>();

// Counter for generating unique IDs
let count = 0;

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

export const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// Generate a unique content hash for a toast
export const generateContentHash = (toast: Partial<ToasterToast>): string => {
  const titleStr = typeof toast.title === 'string' ? toast.title : '';
  const descStr = typeof toast.description === 'string' ? toast.description : '';
  const variantStr = toast.variant || 'default';
  return `${titleStr}|${descStr}|${variantStr}`;
}
