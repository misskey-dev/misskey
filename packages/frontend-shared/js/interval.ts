/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** ドキュメントがアクティブになっていない間は実行を止めるsetInterval。戻り値の関数でdisposeする */
export function createVisibilityAwareInterval(fn: () => void, interval: number, options: {
	immediate?: boolean;
} = {}): () => void {
	let intervalId: number | null = null;
	let lastCalledAt: number | null = null;

	const tick = () => {
		lastCalledAt = Date.now();
		fn();
	};

	const start = () => {
		if (intervalId != null) return;
		if (lastCalledAt == null) {
			if (options.immediate) {
				tick();
			} else {
				lastCalledAt = Date.now();
			}
		} else if (Date.now() - lastCalledAt >= interval) {
			// もし前回の呼び出しからinterval以上の時間が経過していたら、即座に呼び出す
			// （非アクティブ→アクティブに戻った場合など）
			tick();
		}
		intervalId = window.setInterval(tick, interval);
	};

	const stop = () => {
		if (intervalId != null) {
			window.clearInterval(intervalId);
			intervalId = null;
		}
	};

	const onVisibilityChange = () => {
		if (window.document.visibilityState === 'visible') {
			start();
		} else {
			stop();
		}
	};

	window.document.addEventListener('visibilitychange', onVisibilityChange);

	if (window.document.visibilityState === 'visible') {
		start();
	}

	return () => {
		window.document.removeEventListener('visibilitychange', onVisibilityChange);
		stop();
	};
}
