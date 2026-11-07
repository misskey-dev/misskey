/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 設定ファイルのYAMLパースだけを行うワーカー。
// js-yamlは起動時に一度しか使わないため、このワーカー内でのみ読み込み、パース後にワーカーごと破棄することでメインスレッドに常駐させない。
// config.tsからはAtomics.waitで同期的に完了を待つため、どの経路で終了しても必ずsignalを立てること。

import { workerData } from 'node:worker_threads';
import type { MessagePort } from 'node:worker_threads';

export type YamlWorkerData = {
	source: string;
	port: MessagePort;
	signal: Int32Array;
};

export type YamlWorkerResult = { ok: true; value: unknown } | { ok: false; error: unknown };

const { source, port, signal } = workerData as YamlWorkerData;

try {
	// 読み込みの失敗もメインスレッドへ返せるよう、動的importにしている
	const { load } = await import('js-yaml');
	port.postMessage({ ok: true, value: load(source) } satisfies YamlWorkerResult);
} catch (error) {
	port.postMessage({ ok: false, error } satisfies YamlWorkerResult);
} finally {
	Atomics.store(signal, 0, 1);
	Atomics.notify(signal, 0);
}
