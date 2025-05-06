
import { State, Action } from "./toast-types";
import { reducer } from "./toast-reducer";

export const listeners: Array<(state: State) => void> = [];

export let memoryState: State = { toasts: [] };

export function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
