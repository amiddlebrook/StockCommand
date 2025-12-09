import { runAgentWorkflow } from './lib/agent/workflow';

async function main() {
    try {
        await runAgentWorkflow();
    } catch (error) {
        console.error('Workflow failed:', error);
    }
}

main();
