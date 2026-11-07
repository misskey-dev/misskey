/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import { createVisibilityAwareInterval } from './interval.js';

export function useInterval(fn: () => void, interval: number, options: {
	immediate: boolean;
	afterMounted: boolean;
	keepRunningWhenHidden?: boolean;
}): (() => void) | undefined {
	if (Number.isNaN(interval)) return;

	let disposer: (() => void) | null = null;

	const start = () => {
		if (options.keepRunningWhenHidden) {
			if (options.immediate) fn();
			const intervalId = window.setInterval(fn, interval);
			disposer = () => {
				window.clearInterval(intervalId);
			};
		} else {
			disposer = createVisibilityAwareInterval(fn, interval, { immediate: options.immediate });
		}
	};

	const clear = () => {
		if (disposer) {
			disposer();
			disposer = null;
		}
	};

	if (options.afterMounted) {
		onMounted(() => {
			start();
		});
	} else {
		start();
	}

	onActivated(() => {
		if (disposer) return;
		start();
	});

	onDeactivated(() => {
		clear();
	});

	onUnmounted(() => {
		clear();
	});

	return clear;
}
