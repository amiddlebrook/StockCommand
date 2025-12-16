
export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

export function getGoogleAuthUrl(env: any): string {
    if (!env.GOOGLE_CLIENT_ID || !env.APP_URL) {
        throw new Error("Missing Google Auth Configuration");
    }

    const baseUrl = env.APP_URL.endsWith('/') ? env.APP_URL.slice(0, -1) : env.APP_URL;

    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        response_type: "code",
        scope: "email profile",
        access_type: "online",
        prompt: "consent"
    });

    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function getGoogleUser(env: any, code: string): Promise<any> {
    // 1. Exchange code for token
    const baseUrl = env.APP_URL.endsWith('/') ? env.APP_URL.slice(0, -1) : env.APP_URL;
    const tokenParams = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
    });

    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        throw new Error(`Failed to get Google Token: ${err}`);
    }

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Get User Info
    const userResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userResponse.ok) {
        throw new Error("Failed to get Google User Info");
    }

    return await userResponse.json();
}
