export const getToken   = () => localStorage.getItem('auth_token')
export const setToken   = (t: string) => localStorage.setItem('auth_token', t)
export const clearToken = () => localStorage.removeItem('auth_token')

export async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken()
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
