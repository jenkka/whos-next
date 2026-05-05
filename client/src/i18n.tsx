import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'es';

const STORAGE_KEY = 'whosNext.lang';

export type Strings = {
  modeTurn: string;
  modeUpdate: string;
  modeDelete: string;

  turnTitle: string;
  turnSubtitle: string;
  updateTitle: string;
  updateSubtitle: string;
  deleteTitle: string;
  deleteSubtitle: string;

  loading: string;
  noNames: string;

  chooseAction: string;
  updateAction: string;
  deleteAction: string;

  resultPrefix: string;
  resultSuffix: string;

  addPlaceholder: string;
  addButton: string;

  errLoadNames: string;
  msgAdded: (name: string) => string;
  errAddName: string;
  msgDeleted: (name: string) => string;
  errDeleteName: string;
  errProcess: string;
  errWrongPass: string;

  confirmDelete: (name: string) => string;

  promptAdd: string;
  promptUpdate: string;
  promptDelete: string;

  modalCancel: string;
  modalConfirm: string;
};

export const STRINGS: Record<Lang, Strings> = {
  en: {
    modeTurn: 'Turn',
    modeUpdate: 'Update',
    modeDelete: 'Delete',

    turnTitle: "Who's going to watch the movie?",
    turnSubtitle: 'Click on the names to add them',
    updateTitle: 'Update the order',
    updateSubtitle: 'Select who is participating and apply the changes',
    deleteTitle: 'Delete a name',
    deleteSubtitle: 'Click on the name you want to delete',

    loading: 'Thinking...',
    noNames: 'No names yet.',

    chooseAction: "Who's next?",
    updateAction: 'Update order',
    deleteAction: 'Delete',

    resultPrefix: "It's ",
    resultSuffix: "'s turn ✨",

    addPlaceholder: 'Name',
    addButton: 'Add',

    errLoadNames: 'Could not load names.',
    msgAdded: (name: string) => `Added: ${name}`,
    errAddName: 'Wrong password or error adding name.',
    msgDeleted: (name: string) => `Deleted: ${name}`,
    errDeleteName: 'Error deleting name.',
    errProcess: 'Error processing request.',
    errWrongPass: 'Wrong password.',

    confirmDelete: (name: string) => `Delete ${name}? This cannot be undone.`,

    promptAdd: 'Enter the password to add a name:',
    promptUpdate: 'Enter the password to update the list:',
    promptDelete: 'Enter the password to delete names:',

    modalCancel: 'Cancel',
    modalConfirm: 'Confirm',
  },
  es: {
    modeTurn: 'Turno',
    modeUpdate: 'Actualizar',
    modeDelete: 'Borrar',

    turnTitle: '¿Quiénes van a ver la película?',
    turnSubtitle: 'Da click en los nombres para agregarlos',
    updateTitle: 'Actualizar el orden',
    updateSubtitle: 'Selecciona quiénes participan y aplica los cambios',
    deleteTitle: 'Borrar un nombre',
    deleteSubtitle: 'Da click en el nombre que quieras borrar',

    loading: 'Pensando...',
    noNames: 'Aún no hay nombres.',

    chooseAction: '¿A quién le toca?',
    updateAction: 'Actualizar orden',
    deleteAction: 'Borrar',

    resultPrefix: 'Le toca a ',
    resultSuffix: ' ✨',

    addPlaceholder: 'Nombre',
    addButton: 'Añadir',

    errLoadNames: 'No se pudieron cargar los nombres.',
    msgAdded: (name: string) => `Añadido: ${name}`,
    errAddName: 'Contraseña incorrecta o error al añadir el nombre.',
    msgDeleted: (name: string) => `Borrado: ${name}`,
    errDeleteName: 'Error al borrar el nombre.',
    errProcess: 'Error al procesar la solicitud.',
    errWrongPass: 'Contraseña incorrecta.',

    confirmDelete: (name: string) => `¿Borrar a ${name}? Esta acción no se puede deshacer.`,

    promptAdd: 'Introduce la contraseña para añadir un nombre:',
    promptUpdate: 'Introduce la contraseña para actualizar la lista:',
    promptDelete: 'Introduce la contraseña para borrar nombres:',

    modalCancel: 'Cancelar',
    modalConfirm: 'Confirmar',
  },
};

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // ignore
  }
  return 'en';
}

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
};

const LanguageContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => readLang());

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
