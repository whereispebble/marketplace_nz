/** Block real application data in DEV even when an old real auth token is present. */
export function createDataFetch(isDevMode, fetchImpl = fetch) {
  return (input, init) => {
    const url = typeof input === 'string' ? input : input.url || String(input)
    if (isDevMode() && /\/(rest|storage)\/v1\//.test(url)) {
      return Promise.resolve(new Response(JSON.stringify({ message: 'Real data is unavailable in test mode.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      }))
    }
    return fetchImpl(input, { ...init, signal: init?.signal || AbortSignal.timeout(20000) })
  }
}
