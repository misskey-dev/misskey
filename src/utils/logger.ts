import chalk, { Chalk } from 'chalk';

export type LogLevel = 'Error' | 'Warn' | 'Info';

function toLevelColor(level: LogLevel): Chalk {
	switch (level) {
		case 'Error': return chalk.red;
		case 'Warn': return chalk.yellow;
		case 'Info': return chalk.blue;
	}
}

export default class Logger {
	private domain: string;

	constructor(domain: string) {
		this.domain = domain;
	}

	public static log(level: LogLevel, message: string): void {
		const color = toLevelColor(level);
		const time = (new Date()).toLocaleTimeString('ja-JP');
		console.log(`[${time} ${color.bold(level.toUpperCase())}]: ${message}`);
	}

	public static error(message: string): void {
		Logger.log('Error', message);
	}

	public static warn(message: string): void {
		Logger.log('Warn', message);
	}

	public static info(message: string): void {
		Logger.log('Info', message);
	}

	public log(level: LogLevel, message: string): void {
		Logger.log(level, `[${this.domain}] ${message}`);
	}

	public error(message: string): void {
		this.log('Error', message);
	}

	public warn(message: string): void {
		this.log('Warn', message);
	}

	public info(message: string): void {
		this.log('Info', message);
	}
}
