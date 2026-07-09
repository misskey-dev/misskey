/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Logger from '@/logger.js';
import { shutdownTelemetry as defaultShutdownTelemetry } from './telemetry-registry.js';

const logger = new Logger('telemetry', 'green');

type SignalProcess = {
	once(event: 'SIGTERM' | 'SIGINT', listener: () => Promise<void>): unknown;
};

type InstallTelemetrySignalHandlersOptions = {
	process?: SignalProcess;
	shutdownTelemetry?: () => Promise<void>;
	exit?: (code: number) => void;
};

let shuttingDown = false;

export function installTelemetrySignalHandlers(options: InstallTelemetrySignalHandlersOptions = {}): void {
	// テストではprocess/exitを差し替え、本番では実processにSIGTERM/SIGINT handlerを登録する。
	//
	// 注意: このプロジェクトでは app.enableShutdownHooks() が一切呼ばれていないため、
	// NestJSのOnApplicationShutdown経由のgraceful shutdown(GlobalModule.dispose()によるDB/Redis切断、
	// QueueProcessorService.stop()によるqueue drain、ServerService.dispose()によるfastify/WebSocket close)は
	// 本PR以前から実質的に無効(SIGTERM/SIGINTを起点に発火することが無い)だった。
	// このhandlerはリポジトリで初めて有効になる本番SIGTERM/SIGINT handlerであり、telemetryのflushのみを行い
	// 上記のgraceful shutdown処理を経由せずに即exitする。将来enableShutdownHooks()を配線する場合は、
	// この即exitとNestJS側のshutdown sequenceが競合しないよう順序を設計すること。
	const processLike = options.process ?? process;
	const shutdownTelemetry = options.shutdownTelemetry ?? defaultShutdownTelemetry;
	const exit = options.exit ?? ((code: number) => process.exit(code));

	const handleSignal = async () => {
		// 同時に複数signalが来てもflushを二重実行せず、cluster refork抑止用の状態もここで立てる。
		if (shuttingDown) return;
		shuttingDown = true;

		try {
			// 終了直前にBatchSpanProcessor/Sentryのbufferをflushする。
			// (DB/Redis/queue/HTTPサーバーのgraceful closeはここでは行わない。上記の注意を参照。)
			await shutdownTelemetry();
		} catch {
			// telemetry flushの失敗でプロセス終了が止まらないよう、ここでは握り潰す。
		} finally {
			// 既存挙動と同じく、telemetry flush後はプロセスを終了する。
			exit(0);
		}
	};

	// onceにして、同じsignalでhandlerが再入しないようにする。
	processLike.once('SIGTERM', handleSignal);
	processLike.once('SIGINT', handleSignal);

	// app.enableShutdownHooks()未配線の現状、SIGTERM/SIGINT時の処理はtelemetry flushのみであることを
	// 起動時に明示し、DB/Redis/queue/HTTPサーバーのgraceful closeが行われない点を運用者が把握できるようにする。
	logger.info('Registered SIGTERM/SIGINT handler for telemetry flush (this process does not perform NestJS graceful shutdown on these signals).');
}

export function isTelemetryShutdownInProgress(): boolean {
	// masterのcluster exit handlerが、意図したshutdown中のworker終了を再forkしないために参照する。
	return shuttingDown;
}
