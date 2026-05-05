import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'whosNext.selectedNames';

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useSelectedNames() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(readFromStorage()));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected)));
  }, [selected]);

  const toggle = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const prune = useCallback((validNames: Iterable<string>) => {
    const valid = new Set(validNames);
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((name) => {
        if (valid.has(name)) next.add(name);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, []);

  return { selected, toggle, prune };
}
