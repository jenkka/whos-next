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
import { useLang } from './i18n';

type Mode = 'turn' | 'update' | 'delete';

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
  const { lang, setLang, t } = useLang();

  const modeText: Record<Mode, { title: string; subtitle: string }> = {
    turn: { title: t.turnTitle, subtitle: t.turnSubtitle },
    update: { title: t.updateTitle, subtitle: t.updateSubtitle },
    delete: { title: t.deleteTitle, subtitle: t.deleteSubtitle },
  };

  const refresh = async () => {
    try {
      const data = await fetchNames();
      setNames(data.names);
    } catch (err) {
      console.error(err);
      push('error', t.errLoadNames);
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
    return mode === 'update' ? t.updateAction : t.chooseAction;
  }, [choosing, mode, t]);

  const handleAdd = async () => {
    const password = await askPassword(t.promptAdd);
    if (!password) return;

    const trimmed = newNameInput.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      await addName(trimmed, password);
      setNewNameInput('');
      await refresh();
      push('success', t.msgAdded(trimmed));
    } catch (err) {
      console.error(err);
      push('error', t.errAddName);
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

    const promptMsg = next === 'update' ? t.promptUpdate : t.promptDelete;
    const password = await askPassword(promptMsg);
    if (!password) return;

    try {
      await verifyPassword(password);
      setMode(next);
      setAdminPassword(password);
      setDeleteTarget(null);
    } catch (err) {
      push('error', t.errWrongPass);
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
    const ok = window.confirm(t.confirmDelete(target));
    if (!ok) return;

    try {
      await removeName(target, adminPassword);
      setDeleteTarget(null);
      await refresh();
      push('success', t.msgDeleted(target));
    } catch (err) {
      console.error(err);
      push('error', t.errDeleteName);
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
      push('error', t.errProcess);
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

  const text = modeText[mode];

  const langBtnClass = (target: 'en' | 'es') =>
    `px-2 py-1 text-xs font-medium rounded-md transition-colors ${
      lang === target ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <div className="bg-slate-100 flex items-center justify-center min-h-screen font-sans">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t.addPlaceholder}
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
            {adding ? '...' : t.addButton}
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white rounded-lg p-1 shadow border border-slate-200">
        <button onClick={() => switchMode('turn')} className={modeBtnClass('turn')}>
          {t.modeTurn}
        </button>
        <button onClick={() => switchMode('update')} className={modeBtnClass('update')}>
          {t.modeUpdate}
        </button>
        <button onClick={() => switchMode('delete')} className={modeBtnClass('delete')}>
          {t.modeDelete}
        </button>
      </div>

      <div className="bg-white w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{text.title}</h1>
        <p className="text-slate-500 mb-8">{text.subtitle}</p>

        <div className="flex flex-wrap justify-center items-center gap-4 mb-8 min-h-[100px]">
          {names === null ? (
            <p className="text-slate-400">{t.loading}</p>
          ) : names.length === 0 ? (
            <p className="text-slate-400">{t.noNames}</p>
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
            {t.deleteAction}
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
                    {t.resultPrefix}
                    <span className="text-indigo-600">{chosenName}</span>
                    {t.resultSuffix}
                  </>
                ) : null}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-4 left-4 z-10 flex items-center gap-1 bg-white rounded-lg p-1 shadow border border-slate-200">
        <button onClick={() => setLang('en')} className={langBtnClass('en')}>
          EN
        </button>
        <button onClick={() => setLang('es')} className={langBtnClass('es')}>
          ES
        </button>
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
