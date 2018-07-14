import chalk from 'chalk';
import * as dateformat from 'dateformat';

export default class Logger {
	private domain: string;

	constructor(domain: string) {
		this.domain = domain;
	}

	public static log(level: string, message: string): void {
		const time = dateformat(new Date(), 'HH:MM:ss');
		console.log(`[${time} ${level}] ${message}`);
	}

	public static error(message: string): void {
		(new Logger('')).error(message);
	}

	public static warn(message: string): void {
		(new Logger('')).warn(message);
	}

	public static succ(message: string): void {
		(new Logger('')).succ(message);
	}

	public static info(message: string): void {
		(new Logger('')).info(message);
	}

	public log(level: string, message: string) {
		const domain = this.domain.length > 0 ? `[${this.domain}] ` : '';
		Logger.log(level, `${domain}${message}`);
	}

	public error(message: string): void { // 実行を継続できない状況で使う
		this.log(chalk.red.bold('ERROR'), chalk.red.bold(message));
	}

	public warn(message: string): void {　// 実行を継続できるが改善すべき状況で使う
		this.log(chalk.yellow.bold('WARN'), chalk.yellow.bold(message));
	}

	public succ(message: string): void { // 何かに成功した状況で使う
		this.log(chalk.blue.bold('INFO'), chalk.green.bold(message));
	}

	public info(message: string): void { // それ以外
		this.log(chalk.blue.bold('INFO'), message);
	}

}
