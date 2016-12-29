import * as chalk from 'chalk';

export type LogLevel = 'Error' | 'Warn' | 'Info';

function toLevelColor(level: LogLevel): chalk.ChalkStyle {
	switch (level) {
		case 'Error': return chalk.red;
		case 'Warn': return chalk.yellow;
		case 'Info': return chalk.blue;
	}
}

export function log(message: string): void;
export function log(level: LogLevel, message: string): void;
export function log(level: LogLevel, message: string, domain: string): void;
export function log(x: string | LogLevel, message?: string, domain?: string): void {
	const level = typeof message == 'undefined' ? 'Info' : x as LogLevel;
	message = typeof message == 'undefined' ? x : message;
	if (typeof domain == 'string') {
		log(level, `[${domain}] ${message}`);
	} else {
		let color = toLevelColor(level);
		let time = (new Date()).toLocaleTimeString('ja-JP');
		console.log(`[${time} ${color.bold(level.toUpperCase())}]: ${message}`);
	}
}
