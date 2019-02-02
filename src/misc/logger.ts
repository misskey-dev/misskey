import chalk from 'chalk';
import * as dateformat from 'dateformat';

export default class Logger {
	private domain: string;
	private parentLogger: Logger;

	constructor(domain: string) {
		this.domain = domain;
	}

	public createSubLogger(domain: string): Logger {
		const logger = new Logger(domain);
		logger.parentLogger = this;
		return logger;
	}

	public log(level: string, message: string, important = false): void {
		if (this.parentLogger) {
			this.parentLogger.log(level, `[${this.domain}]\t${message}`, important);
		} else {
			const time = dateformat(new Date(), 'HH:MM:ss');
			const log = `${chalk.gray(time)} ${level} [${this.domain}]\t${message}`;
			console.log(important ? chalk.bold(log) : log);
		}
	}

	public error(message: string | Error): void { // 実行を継続できない状況で使う
		this.log(chalk.red.bold('ERROR'), chalk.red.bold(message.toString()));
	}

	public warn(message: string): void {　// 実行を継続できるが改善すべき状況で使う
		this.log(chalk.yellow.bold('WARN'), chalk.yellow.bold(message));
	}

	public succ(message: string, important = false): void { // 何かに成功した状況で使う
		this.log(chalk.blue.green('DONE'), chalk.green.bold(message), important);
	}

	public info(message: string): void { // それ以外
		this.log(chalk.blue.bold('INFO'), message);
	}

}
