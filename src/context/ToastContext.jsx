import { createContext, useContext, useReducer, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, { id: ++toastId, ...action.payload }];
    case 'REMOVE':
      return state.filter(t => t.id !== action.payload);
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = toastId + 1;
    dispatch({ type: 'ADD', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE', payload: id }), duration);
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE', payload: id });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
