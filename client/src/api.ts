export type NamesResponse = { names: string[] };
export type ChosenResponse = { chosenName: string };

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export function fetchNames(): Promise<NamesResponse> {
  return fetch('/api/names').then((r) => jsonOrThrow<NamesResponse>(r));
}

export const addName = async (name: string, password: string) => {
  const response = await fetch('/api/add-name', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': password,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Server rejected the request');
  }

  return response.json();
}

export function chooseName(names: string[]): Promise<ChosenResponse> {
  return fetch('/api/choose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  }).then((r) => jsonOrThrow<ChosenResponse>(r));
}

export function updateOrder(names: string[], password: string): Promise<ChosenResponse> {
  return fetch('/api/update-order', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': password,
    },
    body: JSON.stringify({ names }),
  }).then((r) => jsonOrThrow<ChosenResponse>(r));
}

export const removeName = async (name: string, password: string): Promise<void> => {
  const response = await fetch('/api/remove-name', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': password,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Server rejected the request');
  }
}

export const verifyPassword = async (password: string): Promise<boolean> => {
  const response = await fetch('/api/verify-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // We send the password in the custom header your Go server expects
      'X-Admin-Password': password,
    },
  });

  // If the backend returns 401, .ok will be false
  if (!response.ok) {
    throw new Error('Unauthorized');
  }

  return true;
}
