import * as cluster from 'cluster';
import chalk from 'chalk';
import * as dateformat from 'dateformat';

export default class Logger {
	private domain: string;
	private color?: string;
	private parentLogger: Logger;

	constructor(domain: string, color?: string) {
		this.domain = domain;
		this.color = color;
	}

	public createSubLogger(domain: string, color?: string): Logger {
		const logger = new Logger(domain, color);
		logger.parentLogger = this;
		return logger;
	}

	public log(level: string, message: string, important = false): void {
		const domain = this.color ? chalk.keyword(this.color)(this.domain) : chalk.white(this.domain);
		if (this.parentLogger) {
			this.parentLogger.log(level, `[${domain}]\t${message}`, important);
		} else {
			const time = dateformat(new Date(), 'HH:MM:ss');
			const process = cluster.isMaster ? '*' : cluster.worker.id;
			const log = `${chalk.gray(time)} ${level} ${process}\t[${domain}]\t${message}`;
			console.log(important ? chalk.bold(log) : log);
		}
	}

	public error(message: string | Error): void { // 実行を継続できない状況で使う
		this.log(chalk.red.bold('ERROR'), chalk.red.bold(message.toString()));
	}

	public warn(message: string, important = false): void {　// 実行を継続できるが改善すべき状況で使う
		this.log(chalk.yellow.bold('WARN'), chalk.yellow.bold(message), important);
	}

	public succ(message: string, important = false): void { // 何かに成功した状況で使う
		this.log(chalk.blue.green('DONE'), chalk.green.bold(message), important);
	}

	public info(message: string, important = false): void { // それ以外
		this.log(chalk.blue.bold('INFO'), message, important);
	}

}
