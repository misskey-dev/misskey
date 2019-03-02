import * as cluster from 'cluster';
import * as os from 'os';
import chalk from 'chalk';
import * as dateformat from 'dateformat';
import { program } from '../argv';
import Log from '../models/log';

type Domain = {
	name: string;
	color: string;
};

type Level = 'error' | 'success' | 'warning' | 'debug' | 'info';

export default class Logger {
	private domain: Domain;
	private parentLogger: Logger;
	private store: boolean;

	constructor(domain: string, color?: string, store = true) {
		this.domain = {
			name: domain,
			color: color,
		};
		this.store = store;
	}

	public createSubLogger(domain: string, color?: string, store = true): Logger {
		const logger = new Logger(domain, color, store);
		logger.parentLogger = this;
		return logger;
	}

	private log(level: Level, message: string, data: Record<string, any>, important = false, subDomains: Domain[] = [], store = true): void {
		if (program.quiet) return;
		if (process.env.NODE_ENV === 'test') return;
		if (!this.store) store = false;

		if (this.parentLogger) {
			this.parentLogger.log(level, message, data, important, [this.domain].concat(subDomains), store);
			return;
		}

		const time = dateformat(new Date(), 'HH:MM:ss');
		const worker = cluster.isMaster ? '*' : cluster.worker.id;
		const l =
			level === 'error' ? important ? chalk.bgRed.white('ERR ') : chalk.red('ERR ') :
			level === 'warning' ? chalk.yellow('WARN') :
			level === 'success' ? important ? chalk.bgGreen.white('DONE') : chalk.green('DONE') :
			level === 'debug' ? chalk.gray('VERB') :
			level === 'info' ? chalk.blue('INFO') :
			null;
		const domains = [this.domain].concat(subDomains).map(d => d.color ? chalk.keyword(d.color)(d.name) : chalk.white(d.name));
		const m =
			level === 'error' ? chalk.red(message) :
			level === 'warning' ? chalk.yellow(message) :
			level === 'success' ? chalk.green(message) :
			level === 'debug' ? chalk.gray(message) :
			level === 'info' ? message :
			null;

		let log = `${l} ${worker}\t[${domains.join(' ')}]\t${m}`;
		if (program.withLogTime) log = chalk.gray(time) + ' ' + log;

		console.log(important ? chalk.bold(log) : log);

		if (store) {
			Log.insert({
				createdAt: new Date(),
				machine: os.hostname(),
				worker: worker,
				domain: [this.domain].concat(subDomains).map(d => d.name),
				level: level,
				message: message,
				data: data,
			});
		}
	}

	public error(x: string | Error, data?: Record<string, any>, important = false): void { // 実行を継続できない状況で使う
		if (x instanceof Error) {
			data = data || {};
			data.e = x;
			this.log('error', x.toString(), data, important);
		} else {
			this.log('error', x, data, important);
		}
	}

	public warn(message: string, data?: Record<string, any>, important = false): void {　// 実行を継続できるが改善すべき状況で使う
		this.log('warning', message, data, important);
	}

	public succ(message: string, data?: Record<string, any>, important = false): void { // 何かに成功した状況で使う
		this.log('success', message, data, important);
	}

	public debug(message: string, data?: Record<string, any>, important = false): void { // デバッグ用に使う(開発者に必要だが利用者に不要な情報)
		if (process.env.NODE_ENV != 'production' || program.verbose) {
			this.log('debug', message, data, important);
		}
	}

	public info(message: string, data?: Record<string, any>, important = false): void { // それ以外
		this.log('info', message, data, important);
	}
}
