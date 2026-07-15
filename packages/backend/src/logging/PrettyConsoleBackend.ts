/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import chalk from 'chalk';
import { default as convertColor } from 'color-convert';
import { format as dateFormat } from 'date-fns';
import { envOption } from '@/env.js';
import type { LogBackend } from './LogBackend.js';
import type { LogRecord } from './types.js';

/** Pretty形式の出力処理が外部から受け取る依存関係です。 */
export type PrettyConsoleBackendDependencies = {
	readonly output: (...args: unknown[]) => void;
	readonly withLogTime: () => boolean;
};

const defaultDependencies: PrettyConsoleBackendDependencies = {
	output: (...args) => console.log(...args),
	withLogTime: () => envOption.withLogTime,
};

/**
 * 人が読みやすい従来形式へ整形し、コンソールへ出力します。
 * 色、ラベル、時刻などの見た目だけを担当し、出力可否はLogManagerへ任せます。
 */
export class PrettyConsoleBackend implements LogBackend {
	private readonly dependencies: PrettyConsoleBackendDependencies;

	/**
	 * 出力処理と時刻表示の判定処理を受け取ります。
	 * 省略時は従来どおり、標準のコンソールと環境設定を使用します。
	 */
	constructor(dependencies: Partial<PrettyConsoleBackendDependencies> = {}) {
		this.dependencies = {
			...defaultDependencies,
			...dependencies,
		};
	}

	/**
	 * 共通のログを従来形式へ整形して一件出力します。
	 */
	public write(record: LogRecord): void {
		const legacyLevel = record.compatibility?.legacyLevel;
		// `fatal`は重大なエラーとして扱い、従来の`important`と同じ強調表示にします。
		const important = record.level === 'fatal' || (record.compatibility?.important ?? false);
		const presentationLevel = record.level === 'fatal' ? 'error' : (legacyLevel ?? record.level);
		const label =
			presentationLevel === 'error' ? important ? chalk.bgRed.white('ERR ') : chalk.red('ERR ') :
			presentationLevel === 'warn' ? chalk.yellow('WARN') :
			presentationLevel === 'success' ? important ? chalk.bgGreen.white('DONE') : chalk.green('DONE') :
			presentationLevel === 'debug' ? chalk.gray('VERB') :
			presentationLevel === 'info' ? chalk.blue('INFO') :
			null;
		const contexts = record.context.map(context => context.color
			? chalk.rgb(...convertColor.keyword.rgb(context.color))(context.name)
			: chalk.white(context.name));
		const message =
			presentationLevel === 'error' ? chalk.red(record.message) :
			presentationLevel === 'warn' ? chalk.yellow(record.message) :
			presentationLevel === 'success' ? chalk.green(record.message) :
			presentationLevel === 'debug' ? chalk.gray(record.message) :
			presentationLevel === 'info' ? record.message :
			null;
		// 主プロセスは従来どおり「*」、子プロセスはワーカー番号で識別します。
		const worker = record.isPrimary ? '*' : record.workerId;

		let log = `${label} ${worker}\t[${contexts.join(' ')}]\t${message}`;
		if (this.dependencies.withLogTime()) {
			log = chalk.gray(dateFormat(new Date(record.timestamp), 'HH:mm:ss')) + ' ' + log;
		}

		// `data`は文字列へ埋め込まず、第2引数として渡す従来の挙動を維持します。
		const args: unknown[] = [important ? chalk.bold(log) : log];
		if (record.compatibility?.data != null) {
			args.push(record.compatibility.data);
		}
		this.dependencies.output(...args);
	}
}
