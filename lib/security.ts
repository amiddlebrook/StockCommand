export async function getEncryptionKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("stockcommand-salt"), // Fixed salt for simplicity, ideal is random per record but consistent salt ok for single-tenant
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(text: string, secret: string): Promise<string> {
    try {
        const key = await getEncryptionKey(secret);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);

        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encoded
        );

        // Combine IV + Encrypted Data
        const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Return as Base64
        return btoa(String.fromCharCode(...combined));
    } catch (e) {
        console.error("Encryption failed:", e);
        throw new Error("Encryption failed");
    }
}

export async function decrypt(encryptedBase64: string, secret: string): Promise<string> {
    try {
        const key = await getEncryptionKey(secret);
        const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        throw new Error("Decryption failed");
    }
}
