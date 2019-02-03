import * as cluster from 'cluster';
import chalk from 'chalk';
import * as dateformat from 'dateformat';

const quiet = process.argv.find(x => x == '--quiet');

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
		if (quiet) return;
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

	public error(message: string | Error, important = false): void { // 実行を継続できない状況で使う
		this.log(chalk.red('ERR '), chalk.red(message.toString()), important);
	}

	public warn(message: string, important = false): void {　// 実行を継続できるが改善すべき状況で使う
		this.log(chalk.yellow('WARN'), chalk.yellow(message), important);
	}

	public succ(message: string, important = false): void { // 何かに成功した状況で使う
		this.log(chalk.green('DONE'), chalk.green(message), important);
	}

	public info(message: string, important = false): void { // それ以外
		this.log(chalk.blue('INFO'), message, important);
	}

	public debug(message: string, important = false): void { // デバッグ用に使う
		if (process.env.NODE_ENV != 'production') {
			this.log(chalk.gray('VERB'), chalk.gray(message), important);
		}
	}
}
