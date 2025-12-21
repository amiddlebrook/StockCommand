/**
 * AgentSwarmDO - Durable Object for Agent Swarm Coordination
 * 
 * Manages state and communication for parallel agent swarms.
 * Implements voting/consensus patterns and coordinates multi-agent workflows.
 */

import { Env } from '../../types';

interface SwarmAgent {
    id: string;
    type: 'quant' | 'sentinel' | 'macro' | 'vision' | 'code';
    status: 'idle' | 'processing' | 'complete' | 'error';
    result?: any;
    confidence?: number;
    startTime: number;
    endTime?: number;
}

interface SwarmTask {
    id: string;
    query: string;
    context: Record<string, any>;
    agents: SwarmAgent[];
    consensus?: ConsensusResult;
    createdAt: number;
    completedAt?: number;
}

interface ConsensusResult {
    decision: string;
    confidence: number;
    votes: { agentId: string; vote: string; confidence: number }[];
    resolvedBy?: string;
}

interface SwarmState {
    activeTasks: Map<string, SwarmTask>;
    completedTasks: SwarmTask[];
    totalAgentsSpawned: number;
    totalTokensConsumed: number;
}

export class AgentSwarmDO implements DurableObject {
    private state: DurableObjectState;
    private env: Env;
    private swarmState: SwarmState;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
        this.swarmState = {
            activeTasks: new Map(),
            completedTasks: [],
            totalAgentsSpawned: 0,
            totalTokensConsumed: 0
        };
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        try {
            switch (path) {
                case '/spawn':
                    return await this.handleSpawn(request);
                case '/vote':
                    return await this.handleVote(request);
                case '/consensus':
                    return await this.handleConsensus(request);
                case '/status':
                    return await this.handleStatus(request);
                case '/results':
                    return await this.handleResults(request);
                default:
                    return new Response('Not Found', { status: 404 });
            }
        } catch (error: any) {
            console.error('AgentSwarmDO Error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    /**
     * Spawn a new swarm of agents for parallel processing
     */
    private async handleSpawn(request: Request): Promise<Response> {
        const body = await request.json() as {
            taskId: string;
            query: string;
            context: Record<string, any>;
            agentTypes: ('quant' | 'sentinel' | 'macro' | 'vision' | 'code')[];
            parallelCount?: number;
        };

        const task: SwarmTask = {
            id: body.taskId,
            query: body.query,
            context: body.context,
            agents: body.agentTypes.map((type, i) => ({
                id: `${body.taskId}-${type}-${i}`,
                type,
                status: 'idle',
                startTime: Date.now()
            })),
            createdAt: Date.now()
        };

        this.swarmState.activeTasks.set(task.id, task);
        this.swarmState.totalAgentsSpawned += task.agents.length;

        // Persist state
        await this.state.storage.put('swarmState', {
            ...this.swarmState,
            activeTasks: Array.from(this.swarmState.activeTasks.entries())
        });

        return new Response(JSON.stringify({
            taskId: task.id,
            agentCount: task.agents.length,
            agents: task.agents.map(a => ({ id: a.id, type: a.type }))
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Record a vote from an agent
     */
    private async handleVote(request: Request): Promise<Response> {
        const body = await request.json() as {
            taskId: string;
            agentId: string;
            result: any;
            confidence: number;
        };

        const task = this.swarmState.activeTasks.get(body.taskId);
        if (!task) {
            return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
        }

        const agent = task.agents.find(a => a.id === body.agentId);
        if (!agent) {
            return new Response(JSON.stringify({ error: 'Agent not found' }), { status: 404 });
        }

        agent.status = 'complete';
        agent.result = body.result;
        agent.confidence = body.confidence;
        agent.endTime = Date.now();

        // Check if all agents are complete
        const allComplete = task.agents.every(a => a.status === 'complete' || a.status === 'error');

        await this.state.storage.put('swarmState', {
            ...this.swarmState,
            activeTasks: Array.from(this.swarmState.activeTasks.entries())
        });

        return new Response(JSON.stringify({
            recorded: true,
            allComplete,
            completedCount: task.agents.filter(a => a.status === 'complete').length,
            totalCount: task.agents.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Calculate consensus from agent votes
     * Implements "cheap models vote -> expensive model resolves" pattern
     */
    private async handleConsensus(request: Request): Promise<Response> {
        const body = await request.json() as {
            taskId: string;
            resolverModel?: string;
        };

        const task = this.swarmState.activeTasks.get(body.taskId);
        if (!task) {
            return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
        }

        const completedAgents = task.agents.filter(a => a.status === 'complete' && a.result);
        if (completedAgents.length === 0) {
            return new Response(JSON.stringify({ error: 'No completed agent results' }), { status: 400 });
        }

        // Collect votes (simplified voting logic)
        const votes = completedAgents.map(a => ({
            agentId: a.id,
            vote: typeof a.result === 'string' ? a.result : JSON.stringify(a.result),
            confidence: a.confidence || 0.5
        }));

        // Weighted voting by confidence
        const voteMap = new Map<string, number>();
        votes.forEach(v => {
            const current = voteMap.get(v.vote) || 0;
            voteMap.set(v.vote, current + v.confidence);
        });

        let topVote = '';
        let topScore = 0;
        voteMap.forEach((score, vote) => {
            if (score > topScore) {
                topScore = score;
                topVote = vote;
            }
        });

        // Check if consensus is clear (>70% confidence-weighted agreement)
        const totalWeight = votes.reduce((sum, v) => sum + v.confidence, 0);
        const consensusStrength = topScore / totalWeight;
        const needsResolver = consensusStrength < 0.7;

        task.consensus = {
            decision: topVote,
            confidence: consensusStrength,
            votes,
            resolvedBy: needsResolver ? body.resolverModel : undefined
        };

        task.completedAt = Date.now();

        // Move to completed
        this.swarmState.activeTasks.delete(body.taskId);
        this.swarmState.completedTasks.unshift(task);
        if (this.swarmState.completedTasks.length > 100) {
            this.swarmState.completedTasks.pop();
        }

        await this.state.storage.put('swarmState', {
            ...this.swarmState,
            activeTasks: Array.from(this.swarmState.activeTasks.entries())
        });

        return new Response(JSON.stringify({
            taskId: body.taskId,
            consensus: task.consensus,
            needsResolver,
            processingTime: task.completedAt - task.createdAt
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Get status of a swarm task
     */
    private async handleStatus(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const taskId = url.searchParams.get('taskId');

        if (taskId) {
            const task = this.swarmState.activeTasks.get(taskId) ||
                this.swarmState.completedTasks.find(t => t.id === taskId);

            if (!task) {
                return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
            }

            return new Response(JSON.stringify({
                taskId: task.id,
                status: task.completedAt ? 'complete' : 'processing',
                agentStatuses: task.agents.map(a => ({
                    id: a.id,
                    type: a.type,
                    status: a.status
                })),
                consensus: task.consensus
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Return overall swarm stats
        return new Response(JSON.stringify({
            activeTasks: this.swarmState.activeTasks.size,
            completedTasks: this.swarmState.completedTasks.length,
            totalAgentsSpawned: this.swarmState.totalAgentsSpawned,
            totalTokensConsumed: this.swarmState.totalTokensConsumed
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Get results of completed tasks
     */
    private async handleResults(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '10');

        return new Response(JSON.stringify({
            results: this.swarmState.completedTasks.slice(0, limit).map(t => ({
                taskId: t.id,
                query: t.query,
                consensus: t.consensus,
                agentCount: t.agents.length,
                processingTime: t.completedAt ? t.completedAt - t.createdAt : null
            }))
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
