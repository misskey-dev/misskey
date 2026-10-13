/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { misskeyApi } from '@/utility/misskey-api.js';
import { alert } from '@/os.js';
import { i18n } from '@/i18n.js';

const CLOCK_SKEW_THRESHOLD = 20_000;
const MAX_ROUND_TRIP_TIME = 2_000;
const MAX_CLOCK_CHANGE = 1_000;
const REQUEST_TIMEOUT = 3_000;

export type ClockSkewMeasurement = {
	serverTime: unknown;
	startWallTime: number;
	endWallTime: number;
	roundTripTime: number;
};

/** 1 means the server is ahead; -1 means the device is ahead; 0 means no significant skew. */
export function getClockSkewDirection(measurement: ClockSkewMeasurement): -1 | 0 | 1 | null {
	const { serverTime, startWallTime, endWallTime, roundTripTime } = measurement;
	if (typeof serverTime !== 'number' || !Number.isSafeInteger(serverTime) || serverTime < 0 || serverTime > 8.64e15) return null;
	if (![startWallTime, endWallTime, roundTripTime].every(Number.isFinite)) return null;
	if (roundTripTime < 0 || roundTripTime > MAX_ROUND_TRIP_TIME) return null;
	if (Math.abs((endWallTime - startWallTime) - roundTripTime) >= MAX_CLOCK_CHANGE) return null;

	const offset = serverTime - (startWallTime + roundTripTime / 2);
	// The response's timestamp was generated somewhere within the round trip.
	// Only warn if the entire possible offset interval exceeds the threshold.
	if (Math.abs(offset) - roundTripTime / 2 < CLOCK_SKEW_THRESHOLD) return 0;
	return offset > 0 ? 1 : -1;
}

let checked = false;

/** Called once after the main UI has mounted; never blocks or rejects the boot process. */
export async function checkClockSkew(): Promise<void> {
	if (checked) return;
	checked = true;

	let serverAhead = 0;
	let deviceAhead = 0;

	for (let attempt = 0; attempt < 3; attempt++) {
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
		const startWallTime = Date.now();
		const startMonotonicTime = performance.now();

		try {
			const response = await misskeyApi('ping', {}, null, controller.signal);
			const roundTripTime = performance.now() - startMonotonicTime;
			const endWallTime = Date.now();
			const direction = getClockSkewDirection({
				serverTime: response?.pong,
				startWallTime,
				endWallTime,
				roundTripTime,
			});
			if (direction === 1) serverAhead++;
			if (direction === -1) deviceAhead++;
		} catch {
			// Offline, aborted or malformed requests should not interrupt startup.
		} finally {
			window.clearTimeout(timeout);
		}
	}

	if (serverAhead < 2 && deviceAhead < 2) return;

	try {
		await alert({
			type: 'warning',
			title: i18n.ts._clockSkewWarning.title,
			text: i18n.ts._clockSkewWarning.description,
		});
	} catch {
		// A failed warning must not turn into an unhandled startup rejection.
	}
}
