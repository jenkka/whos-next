import { useEffect } from 'react';

export type ToastKind = 'error' | 'success';
export type ToastMessage = { id: number; kind: ToastKind; text: string };

type Props = {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
};

const colors: Record<ToastKind, string> = {
  error: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
};

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${colors[toast.kind]}`}
    >
      {toast.text}
    </div>
  );
}
