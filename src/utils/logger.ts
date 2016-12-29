import * as chalk from 'chalk';

export type LogLevel = 'Error' | 'Warn' | 'Info';

function toLevelColor(level: LogLevel): chalk.ChalkStyle {
	switch (level) {
		case 'Error': return chalk.red;
		case 'Warn': return chalk.yellow;
		case 'Info': return chalk.blue;
	}
}

export function log(level: LogLevel, message: string): void {
	let color = toLevelColor(level);
	console.log(`[${color.bold(level.toUpperCase())}] ${message}`);
}
