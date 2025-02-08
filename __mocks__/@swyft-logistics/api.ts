export async function authenticatedFetchLegacy(url, token, options) {
  return Promise.resolve({ url, token, options });
}
