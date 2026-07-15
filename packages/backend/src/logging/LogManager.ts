/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import process from 'node:process';
import { envOption } from '@/env.js';
import type { LogBackend } from './LogBackend.js';
import type { LogRecordInput } from './types.js';

/** ログを出力したプロセスを識別するための情報です。 */
export type LogProcessInfo = {
	readonly processId: number;
	readonly isPrimary: boolean;
	readonly workerId: number | null;
};

/**
 * 実行環境から取得する値をまとめた依存関係です。
 * テストでは固定値へ差し替え、時刻やプロセス状態に左右されないようにします。
 */
export type LogManagerDependencies = {
	readonly now: () => Date;
	readonly getProcessInfo: () => LogProcessInfo;
	readonly isQuiet: () => boolean;
	readonly isVerbose: () => boolean;
	readonly getNodeEnv: () => string | undefined;
};

const defaultDependencies: LogManagerDependencies = {
	now: () => new Date(),
	getProcessInfo: () => ({
		processId: process.pid,
		isPrimary: cluster.isPrimary,
		workerId: cluster.isPrimary ? null : (cluster.worker?.id ?? null),
	}),
	isQuiet: () => envOption.quiet,
	isVerbose: () => envOption.verbose,
	getNodeEnv: () => process.env.NODE_ENV,
};

/**
 * ログの出力可否を判断し、すべての出力先で共通となる情報を付加します。
 * Loggerと出力先の間に置くことで、設定や共通情報の扱いを一か所へ集約します。
 */
export class LogManager {
	private backend: LogBackend;
	private readonly dependencies: LogManagerDependencies;

	/**
	 * 出力先と実行環境から値を取得する処理を受け取ります。
	 * 実行環境の取得処理は、必要な項目だけテスト用に差し替えられます。
	 */
	constructor(backend: LogBackend, dependencies: Partial<LogManagerDependencies> = {}) {
		this.backend = backend;
		this.dependencies = {
			...defaultDependencies,
			...dependencies,
		};
	}

	/**
	 * 以後のログを書き込む出力先を切り替えます。
	 * 作成済みのLoggerにも切り替えを反映するため、LogManager側で保持します。
	 */
	public setBackend(backend: LogBackend): void {
		this.backend = backend;
	}

	/**
	 * 出力条件を確認し、共通情報を付加して出力先へ渡します。
	 */
	public write(input: LogRecordInput): void {
		// `quiet`は他の条件より優先し、ログに付随する情報の取得も行いません。
		if (this.dependencies.isQuiet()) return;

		// 本番環境のデバッグログは、明示的に`verbose`が指定された場合だけ出力します。
		if (input.level === 'debug' && this.dependencies.getNodeEnv() === 'production' && !this.dependencies.isVerbose()) return;

		const processInfo = this.dependencies.getProcessInfo();
		// 呼び出し側の配列を共有せず、親から末端までの順序を固定します。
		const context = [...input.context];
		this.backend.write({
			...input,
			context,
			timestamp: this.dependencies.now().toISOString(),
			loggerName: context.map(segment => segment.name).join('.'),
			processId: processInfo.processId,
			isPrimary: processInfo.isPrimary,
			workerId: processInfo.workerId,
		});
	}
}
