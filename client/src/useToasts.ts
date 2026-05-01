import { useCallback, useState } from 'react';
import type { ToastKind, ToastMessage } from './Toast';

let nextId = 1;

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    setToasts((prev) => [...prev, { id: nextId++, kind, text }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}
