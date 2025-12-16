import { compare, hash } from 'bcryptjs';
import { parse, serialize } from 'cookie';

const SALT_ROUNDS = 10;
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
    return await hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
}

export async function createSession(env: any, userId: string, userAgent: string | null, ip: string | null): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + SESSION_DURATION;

    // Store in D1
    if (env.DB) {
        await env.DB.prepare(
            `INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, last_accessed, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(sessionId, userId, now, expiresAt, now, ip, userAgent).run();
    } else if (env.USER_SESSIONS_KV) {
        // Fallback to KV if D1 not available (though schema uses D1)
         await env.USER_SESSIONS_KV.put(sessionId, JSON.stringify({ userId, expiresAt }), { expiration: SESSION_DURATION });
    }

    return sessionId;
}

export async function getSession(env: any, request: Request): Promise<any | null> {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;

    const cookies = parse(cookieHeader);
    const sessionId = cookies['sb_session'];

    if (!sessionId) return null;

    // Check D1
    if (env.DB) {
        const session = await env.DB.prepare(
            `SELECT * FROM user_sessions WHERE session_id = ? AND expires_at > ?`
        ).bind(sessionId, Math.floor(Date.now() / 1000)).first();

        if (session) {
             // Update last_accessed async (fire and forget)
            env.DB.prepare(`UPDATE user_sessions SET last_accessed = ? WHERE session_id = ?`)
                .bind(Math.floor(Date.now() / 1000), sessionId).run();
            
            // Get user details
            const user = await env.DB.prepare(`SELECT id, email, name, preferences FROM users WHERE id = ?`)
                .bind(session.user_id).first();
            
            return user;
        }
    }
    
    return null;
}

export async function destroySession(env: any, request: Request): Promise<void> {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return;
    const cookies = parse(cookieHeader);
    const sessionId = cookies['sb_session'];

    if (sessionId && env.DB) {
        await env.DB.prepare(`DELETE FROM user_sessions WHERE session_id = ?`).bind(sessionId).run();
    }
}

export function createSessionCookie(sessionId: string): string {
    return serialize('sb_session', sessionId, {
        httpOnly: true,
        secure: true, // Always true in Cloudflare
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION
    });
}

export function createClearSessionCookie(): string {
    return serialize('sb_session', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: -1
    });
}
