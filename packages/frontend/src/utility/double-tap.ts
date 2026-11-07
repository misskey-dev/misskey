/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function makeDoubleTapDetector(onDoubletap: (event: TouchEvent) => void) {
	const positionThreshold = 10; // px
	const durationThreshold = 300; // ms

	let lastTapTime = 0;
	let lastTapPosition = { x: 0, y: 0 };

	function onTouchstart(ev: TouchEvent) {
		if (ev.touches.length !== 1) return;

		const currentTime = new Date().getTime();
		const tapLength = currentTime - lastTapTime;
		const positionDelta = Math.max(
			Math.abs(ev.touches[0].clientX - lastTapPosition.x),
			Math.abs(ev.touches[0].clientY - lastTapPosition.y),
		);

		if (tapLength < durationThreshold && tapLength > 0 && positionDelta < positionThreshold) { // ダブルタップ
			onDoubletap(ev);
			lastTapTime = 0;
			return;
		}

		lastTapTime = currentTime;
		lastTapPosition = {
			x: ev.touches[0].clientX,
			y: ev.touches[0].clientY,
		};
	}

	function onTouchmove(ev: TouchEvent) {
		const positionDelta = Math.max(
			Math.abs(ev.touches[0].clientX - lastTapPosition.x),
			Math.abs(ev.touches[0].clientY - lastTapPosition.y),
		);
		if (positionDelta > positionThreshold) {
			lastTapTime = 0;
		}
	}

	function reset() {
		lastTapTime = 0;
		lastTapPosition = { x: 0, y: 0 };
	}

	return {
		onTouchstart,
		onTouchmove,
		reset,
	};
}
