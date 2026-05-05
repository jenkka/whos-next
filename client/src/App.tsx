import { useEffect, useMemo, useState } from 'react';
import {
  addName,
  chooseName,
  fetchNames,
  removeName,
  updateOrder,
  verifyPassword,
} from './api';
import { useSelectedNames } from './useSelectedNames';
import { useToasts } from './useToasts';
import { ToastStack } from './Toast';
import { PasswordPromptModal, usePasswordPrompt } from './PasswordPrompt';

type Mode = 'turn' | 'update' | 'delete';

const MODE_TEXT: Record<Mode, { title: string; subtitle: string }> = {
  turn: {
    title: '¿Quiénes van a ver la película?',
    subtitle: 'Da click en los nombres para agregarlos',
  },
  update: {
    title: 'Actualizar el orden',
    subtitle: 'Selecciona quiénes participan y aplica los cambios',
  },
  delete: {
    title: 'Borrar un nombre',
    subtitle: 'Da click en el nombre que quieras borrar',
  },
};

export default function App() {
  const [names, setNames] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [mode, setMode] = useState<Mode>('turn');
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [chosenName, setChosenName] = useState<string | null>(null);

  const { selected, toggle, prune } = useSelectedNames();
  const { toasts, push, dismiss } = useToasts();
  const {
    request: passwordRequest,
    ask: askPassword,
    submit: submitPassword,
    cancel: cancelPassword,
  } = usePasswordPrompt();

  const refresh = async () => {
    try {
      const data = await fetchNames();
      setNames(data.names);
    } catch (err) {
      console.error(err);
      push('error', 'No se pudieron cargar los nombres.');
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (names) prune(names);
  }, [names, prune]);

  const chooseDisabled = selected.size === 0 || choosing;
  const chooseLabel = useMemo(() => {
    if (choosing) return '-';
    return mode === 'update' ? 'Actualizar orden' : '¿A quién le toca?';
  }, [choosing, mode]);

  const handleAdd = async () => {
    const password = await askPassword('Introduce la contraseña para añadir un nombre:');
    if (!password) return;

    const trimmed = newNameInput.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      await addName(trimmed, password);
      setNewNameInput('');
      await refresh();
      push('success', `Añadido: ${trimmed}`);
    } catch (err) {
      console.error(err);
      push('error', 'Contraseña incorrecta o error al añadir el nombre.');
    } finally {
      setAdding(false);
    }
  };

  const switchMode = async (next: Mode) => {
    if (next === mode) return;
    if (next === 'turn') {
      setMode('turn');
      setAdminPassword(null);
      setDeleteTarget(null);
      return;
    }

    const reason = next === 'update' ? 'actualizar la lista' : 'borrar nombres';
    const password = await askPassword(`Introduce la contraseña para ${reason}:`);
    if (!password) return;

    try {
      await verifyPassword(password);
      setMode(next);
      setAdminPassword(password);
      setDeleteTarget(null);
    } catch (err) {
      push('error', 'Contraseña incorrecta.');
    }
  };

  const handleBubbleClick = (name: string) => {
    if (mode === 'delete') {
      setDeleteTarget((prev) => (prev === name ? null : name));
      return;
    }
    toggle(name);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !adminPassword) return;

    const target = deleteTarget;
    const ok = window.confirm(`¿Borrar a ${target}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    try {
      await removeName(target, adminPassword);
      setDeleteTarget(null);
      await refresh();
      push('success', `Borrado: ${target}`);
    } catch (err) {
      console.error(err);
      push('error', 'Error al borrar el nombre.');
    }
  };

  const handleChoose = async () => {
    if (selected.size === 0) return;
    if (mode === 'update' && !adminPassword) return;

    setChoosing(true);
    try {
      const namesArray = Array.from(selected);
      const data =
        mode === 'update'
          ? await updateOrder(namesArray, adminPassword!)
          : await chooseName(namesArray);
      setChosenName(data.chosenName);
    } catch (err) {
      push('error', 'Error al procesar la solicitud.');
    } finally {
      setChoosing(false);
    }
  };

  const bubbleClassName = (name: string) => {
    if (mode === 'delete') {
      return `bubble bubble-danger ${deleteTarget === name ? 'bubble-danger-active' : ''}`;
    }
    return `bubble ${selected.has(name) ? 'bubble-selected' : ''}`;
  };

  const modeBtnClass = (target: Mode) => {
    if (mode !== target) return 'mode-btn';
    return `mode-btn ${target === 'delete' ? 'mode-btn-active-danger' : 'mode-btn-active'}`;
  };

  const text = MODE_TEXT[mode];

  return (
    <div className="bg-slate-100 flex items-center justify-center min-h-screen font-sans">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nombre"
            value={newNameInput}
            onChange={(e) => setNewNameInput(e.target.value)}
            disabled={adding}
            className="p-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-100"
          />
          <button
            onClick={handleAdd}
            disabled={adding || newNameInput.trim() === ''}
            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {adding ? '...' : 'Añadir'}
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white rounded-lg p-1 shadow border border-slate-200">
        <button onClick={() => switchMode('turn')} className={modeBtnClass('turn')}>
          Turno
        </button>
        <button onClick={() => switchMode('update')} className={modeBtnClass('update')}>
          Actualizar
        </button>
        <button onClick={() => switchMode('delete')} className={modeBtnClass('delete')}>
          Borrar
        </button>
      </div>

      <div className="bg-white w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{text.title}</h1>
        <p className="text-slate-500 mb-8">{text.subtitle}</p>

        <div className="flex flex-wrap justify-center items-center gap-4 mb-8 min-h-[100px]">
          {names === null ? (
            <p className="text-slate-400">Pensando...</p>
          ) : names.length === 0 ? (
            <p className="text-slate-400">Aún no hay nombres.</p>
          ) : (
            names.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleBubbleClick(name)}
                className={bubbleClassName(name)}
              >
                {name}
              </button>
            ))
          )}
        </div>

        {mode === 'delete' ? (
          <button
            onClick={handleDelete}
            disabled={!deleteTarget}
            className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
          >
            Borrar
          </button>
        ) : (
          <>
            <button
              onClick={handleChoose}
              disabled={chooseDisabled}
              className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
            >
              {chooseLabel}
            </button>

            <div
              className={`mt-8 p-6 bg-slate-50 rounded-lg min-h-[100px] flex items-center justify-center transition-opacity duration-300 ${
                chosenName || choosing ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <p className="text-2xl font-semibold text-slate-700">
                {choosing ? (
                  '...'
                ) : chosenName ? (
                  <>
                    Le toca a <span className="text-indigo-600">{chosenName}</span> ✨
                  </>
                ) : null}
              </p>
            </div>
          </>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <PasswordPromptModal
        request={passwordRequest}
        onSubmit={submitPassword}
        onCancel={cancelPassword}
      />
    </div>
  );
}
