import * as cluster from 'cluster';
import chalk from 'chalk';
import * as dateformat from 'dateformat';
import { program } from '../argv';

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

	private log(level: string, message: string, important = false, subDomains: string[] = []): void {
		if (program.quiet) return;
		if (process.env.NODE_ENV === 'test') return;
		const domain = this.color ? chalk.keyword(this.color)(this.domain) : chalk.white(this.domain);
		const domains = [domain].concat(subDomains);
		if (this.parentLogger) {
			this.parentLogger.log(level, message, important, domains);
		} else {
			const time = dateformat(new Date(), 'HH:MM:ss');
			const process = cluster.isMaster ? '*' : cluster.worker.id;
			let log = `${level} ${process}\t[${domains.join(' ')}]\t${message}`;
			if (program.withLogTime) log = chalk.gray(time) + ' ' + log;
			console.log(important ? chalk.bold(log) : log);
		}
	}

	public error(message: string | Error, important = false): void { // 実行を継続できない状況で使う
		this.log(important ? chalk.bgRed.white('ERR ') : chalk.red('ERR '), chalk.red(message.toString()), important);
	}

	public warn(message: string, important = false): void {　// 実行を継続できるが改善すべき状況で使う
		this.log(chalk.yellow('WARN'), chalk.yellow(message), important);
	}

	public succ(message: string, important = false): void { // 何かに成功した状況で使う
		this.log(important ? chalk.bgGreen.white('DONE') : chalk.green('DONE'), chalk.green(message), important);
	}

	public debug(message: string, important = false): void { // デバッグ用に使う(開発者に必要だが利用者に不要な情報)
		if (process.env.NODE_ENV != 'production' || program.verbose) {
			this.log(chalk.gray('VERB'), chalk.gray(message), important);
		}
	}

	public info(message: string, important = false): void { // それ以外
		this.log(chalk.blue('INFO'), message, important);
	}
}
