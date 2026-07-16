/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type ShutdownSignalProcess = {
	once(event: 'SIGTERM' | 'SIGINT', listener: () => Promise<void>): unknown;
};

const SHUTDOWN_TIMEOUT_MS = 10_000;

export type ShutdownTask = () => Promise<void>;

export type ShutdownHandlerOptions = {
	/** The process-like object that receives the signal handlers. */
	process?: ShutdownSignalProcess;
	/** Shutdown tasks, executed in array order. */
	shutdownTasks: readonly ShutdownTask[];
	/** Process termination function. */
	exit?: (code: number) => void;
	/** Optional boot logger hook used after signal handlers are registered. */
	onRegistered?: (message: string) => void;
};

let shuttingDown = false;

/**
 * Register the process-level shutdown signals.
 *
 * Boot owns signal coordination and receives shutdown tasks through callbacks
 * so individual domains do not depend on each other.
 *
 * 注意: このプロジェクトでは app.enableShutdownHooks() が一切呼ばれていないため、
 * NestJSのOnApplicationShutdown経由のgraceful shutdown(GlobalModule.dispose()によるDB/Redis切断、
 * QueueProcessorService.stop()によるqueue drain、ServerService.dispose()によるfastify/WebSocket close)は
 * SIGTERM/SIGINTを起点には発火しない。このhandlerはそれらを経由せず、登録された終了処理を実行して即exitする。
 * 将来enableShutdownHooks()を配線する場合は、この即exitとNestJS側のshutdown sequenceが競合しないよう順序を設計すること。
 */
export function installShutdownSignalHandlers(options: ShutdownHandlerOptions): void {
	// テストではprocess/exitを差し替え、本番では実processにSIGTERM/SIGINT handlerを登録する。
	const processLike = options.process ?? process;
	const exit = options.exit ?? ((code: number) => process.exit(code));

	const handleSignal = async () => {
		// 同時に複数signalが来てもflushを二重実行せず、cluster refork抑止用の状態もここで立てる。
		if (shuttingDown) return;
		shuttingDown = true;

		let timedOut = false;
		let timeout: NodeJS.Timeout | undefined;
		try {
			// 処理時間上限つきのシャットダウンプロセス
			await Promise.race([
				(async () => {
					for (const shutdownTask of options.shutdownTasks) {
						if (timedOut) return;
						try {
							await shutdownTask();
						} catch (error) {
							// 1つの終了処理の失敗で後続タスクを妨げないよう、stderrへフォールバックする。
							try {
								console.error('Shutdown task failed:', error);
							} catch {
								// stderrの出力自体が失敗しても、残りの終了処理とexitは継続する。
							}
						}
					}
				})(),
				new Promise<void>(resolve => {
					timeout = setTimeout(() => {
						timedOut = true;
						try {
							console.error(`Shutdown tasks timed out after ${SHUTDOWN_TIMEOUT_MS}ms.`);
						} catch {
							// stderrの出力自体が失敗してもexitは継続する。
						}
						resolve();
					}, SHUTDOWN_TIMEOUT_MS);
				}),
			]);
		} finally {
			if (timeout != null) clearTimeout(timeout);
		}

		// 既存挙動と同じく、終了処理後はプロセスを終了する。
		exit(0);
	};

	// onceにして、同じsignalでhandlerが再入しないようにする。
	processLike.once('SIGTERM', handleSignal);
	processLike.once('SIGINT', handleSignal);

	// app.enableShutdownHooks()未配線の現状、SIGTERM/SIGINT時には登録済み終了処理のみを行う。
	options.onRegistered?.('Registered SIGTERM/SIGINT shutdown handler (this process does not perform NestJS graceful shutdown on these signals).');
}

export function isShutdownInProgress(): boolean {
	// masterのcluster exit handlerが、意図したshutdown中のworker終了を再forkしないために参照する。
	return shuttingDown;
}
