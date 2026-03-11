/**
 * Wallet Error Parser - Converts raw wallet errors to human-readable messages
 */

const ERROR_MAP: Record<string, string> = {
  "user rejected":                  "Transaction cancelled. Nothing was submitted.",
  "user abort":                     "Transaction cancelled. Nothing was submitted.",
  "insufficient balance":           "Insufficient balance for this transaction.",
  "insufficient funds":             "Insufficient funds. Check your wallet balance.",
  "network error":                  "Network error. Check your connection and try again.",
  "timeout":                        "Request timed out. The network may be congested.",
  "nonce":                          "Nonce conflict. Please wait a few seconds and retry.",
  "contract not found":             "Contract not found. You may be on the wrong network.",
  "transaction reverted":           "Transaction reverted on-chain. Please try again.",
  "nullifier already spent":        "This shield note has already been used (nullifier spent).",
  "root too stale":                 "Proof is outdated. Please regenerate and try again.",
  "invalid proof":                  "Proof verification failed. Please regenerate.",
  "proof generation failed":         "Proof generation failed. Please try again.",
  "worker not initialized":         "ZK prover not ready. Please wait a moment.",
  "not connected":                  "Connect your wallet to continue.",
};

export function parseWalletError(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  const message = error instanceof Error
    ? error.message.toLowerCase()
    : String(error).toLowerCase();

  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (message.includes(key)) return friendly;
  }

  // Sanitize long technical errors
  if (message.length > 120) {
    return "An unexpected error occurred. Please try again.";
  }

  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
