import * as chalk from 'chalk';

export type LogLevel = 'Error' | 'Warn' | 'Info';

function toLevelColor(level: LogLevel): chalk.ChalkStyle {
	switch (level) {
		case 'Error': return chalk.red;
		case 'Warn': return chalk.yellow;
		case 'Info': return chalk.blue;
	}
}

export default class Logger {
	domain: string;

	static log(level: LogLevel, message: string): void {
		let color = toLevelColor(level);
		let time = (new Date()).toLocaleTimeString('ja-JP');
		console.log(`[${time} ${color.bold(level.toUpperCase())}]: ${message}`);
	}

	static error(message: string): void {
		Logger.log('Error', message);
	}

	static warn(message: string): void {
		Logger.log('Warn', message);
	}

	static info(message: string): void {
		Logger.log('Info', message);
	}

	constructor(domain: string) {
		this.domain = domain;
	}

	log(level: LogLevel, message: string): void {
		Logger.log(level, `[${this.domain}] ${message}`);
	}

	error(message: string): void {
		this.log('Error', message);
	}

	warn(message: string): void {
		this.log('Warn', message);
	}

	info(message: string): void {
		this.log('Info', message);
	}
}
