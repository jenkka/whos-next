import { useEffect, useMemo, useState } from 'react';
import { addName, chooseName, fetchNames, updateOrder, verifyPassword } from './api';
import { useSelectedNames } from './useSelectedNames';
import { useToasts } from './useToasts';
import { ToastStack } from './Toast';

export default function App() {
  const [names, setNames] = useState<string[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [chosenName, setChosenName] = useState<string | null>(null);

  const { selected, toggle } = useSelectedNames();
  const { toasts, push, dismiss } = useToasts();

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

  const chooseDisabled = selected.size === 0 || choosing;
  const chooseLabel = useMemo(() => {
    if (choosing) return '-';
    return updateMode ? 'Actualizar orden' : '¿A quién le toca?';
  }, [choosing, updateMode]);

  const handleAdd = async () => {
    const password = window.prompt('Introduce la contraseña para añadir un nombre:');

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

  const handleToggleUpdateMode = async (checked: boolean) => {
    // If they are turning it OFF, just let them.
      if (!checked) {
        setUpdateMode(false);
        return;
      }

      // If they are turning it ON, verify with the backend
      const password = window.prompt('Introduce la contraseña para actualizar la lista:');
      if (!password) return;

      try {
        // You'll need a verifyPassword(password) helper in your api.ts
        await verifyPassword(password);

        // If it didn't throw an error, the password is correct!
        setUpdateMode(true);
      } catch (err) {
        push('error', 'Contraseña incorrecta.');
      }
  };

  const handleChoose = async () => {
    if (selected.size === 0) return;

    // If we are in update mode, we need a password for the backend to accept the PUT request
    let password = "";
    if (updateMode) {
      const p = window.prompt('Confirma la contraseña para aplicar los cambios:');
      if (!p) return;
      password = p;
    }

    setChoosing(true);
    try {
      const namesArray = Array.from(selected);
      // Pass the password to your API helpers
      const data = updateMode
        ? await updateOrder(namesArray, password)
        : await chooseName(namesArray);

      setChosenName(data.chosenName);
    } catch (err) {
      push('error', 'Error al procesar la solicitud.');
    } finally {
      setChoosing(false);
    }
  };

  return (
    <div className="bg-slate-100 flex items-center justify-center min-h-screen font-sans">
      <div className="absolute top-4 left-4 flex items-center gap-4">
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

      <div className="absolute top-4 right-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Actualizar</span>
          <label className="toggle-container">
            <input
              type="checkbox"
              checked={updateMode}
              onChange={(e) => handleToggleUpdateMode(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </div>

      <div className="bg-white w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">¿Quiénes van a ver la película?</h1>
        <p className="text-slate-500 mb-8">Da click en los nombres para agregarlos</p>

        <div className="flex flex-wrap justify-center items-center gap-4 mb-8 min-h-[100px]">
          {names === null ? (
            <p className="text-slate-400">Pensando...</p>
          ) : names.length === 0 ? (
            <p className="text-slate-400">Aún no hay nombres.</p>
          ) : (
            names.map((name) => {
              const isSelected = selected.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggle(name)}
                  className={`bubble ${isSelected ? 'bubble-selected' : ''}`}
                >
                  {name}
                </button>
              );
            })
          )}
        </div>

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
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
