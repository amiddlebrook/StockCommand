/**
 * EntityLockDO - Durable Object for per-entity locking
 * Prevents duplicate refresh jobs, tracks freshness state
 * Designed for 1M+ concurrent users
 */

import { JobStatus } from '../lib/types/artifacts';

interface EntityState {
    status: JobStatus;
    lastRunAt: number;
    lastError?: string;
    freshnessMs: number; // TTL for "fresh" status
}

export class EntityLockDO implements DurableObject {
    private state: DurableObjectState;
    private entityState: EntityState = {
        status: 'idle',
        lastRunAt: 0,
        freshnessMs: 5 * 60 * 1000, // Default 5 min
    };

    constructor(state: DurableObjectState) {
        this.state = state;
        // Restore state from storage
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get<EntityState>('state');
            if (stored) this.entityState = stored;
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        switch (action) {
            case 'status':
                return this.getStatus();

            case 'acquire':
                return this.acquireLock(request);

            case 'complete':
                return this.completeLock(request);

            case 'fail':
                return this.failLock(request);

            default:
                return new Response('Invalid action', { status: 400 });
        }
    }

    private getStatus(): Response {
        const now = Date.now();

        // Check if still fresh
        if (this.entityState.status === 'fresh') {
            const age = now - this.entityState.lastRunAt;
            if (age > this.entityState.freshnessMs) {
                this.entityState.status = 'idle';
            }
        }

        return Response.json({
            status: this.entityState.status,
            lastRunAt: this.entityState.lastRunAt,
            lastError: this.entityState.lastError,
            isFresh: this.entityState.status === 'fresh',
            ageMs: now - this.entityState.lastRunAt,
        });
    }

    private async acquireLock(request: Request): Promise<Response> {
        const now = Date.now();
        const body = await request.json() as { freshnessMs?: number };

        // Update freshness TTL if provided
        if (body.freshnessMs) {
            this.entityState.freshnessMs = body.freshnessMs;
        }

        // Already running? Return immediately
        if (this.entityState.status === 'running') {
            return Response.json({ acquired: false, status: 'running' });
        }

        // Still fresh? No need to refresh
        if (this.entityState.status === 'fresh') {
            const age = now - this.entityState.lastRunAt;
            if (age < this.entityState.freshnessMs) {
                return Response.json({ acquired: false, status: 'fresh', ageMs: age });
            }
        }

        // Acquire lock
        this.entityState.status = 'running';
        this.entityState.lastRunAt = now;
        this.entityState.lastError = undefined;
        await this.state.storage.put('state', this.entityState);

        return Response.json({ acquired: true, status: 'running' });
    }

    private async completeLock(_request: Request): Promise<Response> {
        this.entityState.status = 'fresh';
        this.entityState.lastRunAt = Date.now();
        this.entityState.lastError = undefined;
        await this.state.storage.put('state', this.entityState);

        return Response.json({ status: 'fresh' });
    }

    private async failLock(request: Request): Promise<Response> {
        const body = await request.json() as { error?: string };

        this.entityState.status = 'error';
        this.entityState.lastError = body.error || 'Unknown error';
        await this.state.storage.put('state', this.entityState);

        return Response.json({ status: 'error', error: this.entityState.lastError });
    }
}
