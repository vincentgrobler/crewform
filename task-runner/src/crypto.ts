/**
 * Decrypts an API key retrieved from the database.
 * 
 * NOTE: Currently, the frontend stores the raw key directly in `encrypted_key` 
 * because the Edge Function for AES-256-GCM encryption is not yet implemented 
 * (Ticket 2.4 says it is via Edge Function, but it hasn't been built yet).
 * 
 * When the Edge Function is built, this function must be updated to decrypt 
 * using the shared ENCRYPTION_KEY secret.
 */
export function decryptApiKey(encryptedKey: string): string {
    // Return the raw key for now.
    return encryptedKey;
}
