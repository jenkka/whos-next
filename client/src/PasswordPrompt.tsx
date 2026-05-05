import { useCallback, useState } from 'react';

type Request = {
  message: string;
  resolve: (password: string | null) => void;
};

export function usePasswordPrompt() {
  const [request, setRequest] = useState<Request | null>(null);

  const ask = useCallback((message: string) => {
    return new Promise<string | null>((resolve) => {
      setRequest({ message, resolve });
    });
  }, []);

  const submit = (password: string) => {
    request?.resolve(password);
    setRequest(null);
  };

  const cancel = () => {
    request?.resolve(null);
    setRequest(null);
  };

  return { request, ask, submit, cancel };
}

type Props = {
  request: Request | null;
  onSubmit: (password: string) => void;
  onCancel: () => void;
};

export function PasswordPromptModal({ request, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState('');

  if (!request) return null;

  const handleSubmit = () => {
    onSubmit(value);
    setValue('');
  };

  const handleCancel = () => {
    setValue('');
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleCancel();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <p className="text-slate-700 mb-4">{request.message}</p>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          autoComplete="off"
          data-bwignore="true"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          className="w-full p-2 border border-slate-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-md"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
