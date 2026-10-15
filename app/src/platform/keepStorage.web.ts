/**
 * Web: browsers may clear a site's storage when space runs low (Safari even after a week without a
 * visit). Asking for persistent storage keeps the save where the browser allows it; a refusal changes
 * nothing, so the answer is not awaited.
 */
export function askToKeepStorage(): void {
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {
    // Older browsers: no storage manager
  }
}
