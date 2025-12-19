import { AgentAction } from './types';

export class ActionExecutor {

    public async execute(actions: AgentAction[]): Promise<void> {

        // Group actions by type
        const trades = actions.filter(a => ['BUY', 'SELL', 'TRIM'].includes(a.type));
        const alerts = actions.filter(a => a.type === 'ALERT');

        if (trades.length > 0) {
            console.log(`[Executor] Processing ${trades.length} trade recommendations...`);
            // In a real app, this would verify balance and place orders via Broker API
            // For now, we generate a Trade Plan CSV
            await this.createSpreadsheet(trades, 'Trade_Plan');
        }

        if (alerts.length > 0) {
            console.log(`[Executor] Processing ${alerts.length} alerts...`);
            for (const alert of alerts) {
                await this.sendEmailAlert(alert);
            }
        }
    }

    private async sendEmailAlert(action: AgentAction) {
        // TODO: Integrate with email service (e.g., SendGrid/Mailgun)
        // For worker environment, we would make a fetch() call to the mail provider API
        console.log(`--> [EMAIL] Alert: ${action.ticker || 'General'} - ${action.reason}`);
    }

    private async createSpreadsheet(actions: AgentAction[], filename: string) {
        // Generate CSV content
        const header = 'Type,Ticker,Sector,Reason,Confidence\n';
        const rows = actions.map(a =>
            `${a.type},${a.ticker || ''},${a.sector || ''},"${a.reason.replace(/"/g, '""')}",${a.confidence}`
        ).join('\n');

        const csvContent = header + rows;

        console.log(`--> [SPREADSHEET] Generated ${filename}.csv:\n${csvContent}`);
        // In a browser context, we could trigger a download
        // In a worker context, we might upload this to R2 or email it as attachment
    }
}
