/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const CLOCK_SKEW_THRESHOLD = 20_000;
const MAX_ROUND_TRIP_TIME = 2_000;
const MAX_CLOCK_CHANGE = 1_000;
const DATE_HEADER_PRECISION = 1_000;
const REQUEST_TIMEOUT = 3_000;

export type ClockSkewMeasurement = {
	serverTime: unknown;
	startWallTime: number;
	endWallTime: number;
	roundTripTime: number;
	precision?: number;
};

/** 1 means the server is ahead; -1 means the device is ahead; 0 means no significant skew. */
export function getClockSkewDirection(measurement: ClockSkewMeasurement): -1 | 0 | 1 | null {
	const { serverTime, startWallTime, endWallTime, roundTripTime, precision = 0 } = measurement;
	if (typeof serverTime !== 'number' || !Number.isSafeInteger(serverTime) || serverTime < 0 || serverTime > 8.64e15) return null;
	if (![startWallTime, endWallTime, roundTripTime].every(Number.isFinite)) return null;
	if (roundTripTime < 0 || roundTripTime > MAX_ROUND_TRIP_TIME) return null;
	if (Math.abs((endWallTime - startWallTime) - roundTripTime) >= MAX_CLOCK_CHANGE) return null;

	const offset = serverTime - (startWallTime + roundTripTime / 2);
	// The response's timestamp was generated somewhere within the round trip.
	// Only warn if the entire possible offset interval exceeds the threshold.
	if (Math.abs(offset) - roundTripTime / 2 - precision < CLOCK_SKEW_THRESHOLD) return 0;
	return offset > 0 ? 1 : -1;
}

let enabled = false;
let finished = false;
let samples = 0;
let serverAhead = 0;
let deviceAhead = 0;
const pendingDirections: (-1 | 0 | 1)[] = [];

/** Enables observation after the main UI mounts and fills missing startup samples. */
export function initClockSkewCheck(): void {
	if (enabled) return;
	enabled = true;
	for (const direction of pendingDirections.splice(0)) void acceptMeasurement(direction);
	// Give requests already in flight a chance to provide the required samples.
	window.setTimeout(() => { void completeStartupMeasurements(); }, 1_000);
}

/** Observes fresh POST API responses, allowing for the Date header's second precision. */
export async function observeClockSkew(headers: Headers, measurement: Omit<ClockSkewMeasurement, 'serverTime' | 'precision'>): Promise<void> {
	if (finished) return;
	const date = headers.get('Date');
	// Cached responses may describe an earlier request, rather than the current server time.
	if (headers.has('Age') || date == null || !/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(date)) return;
	const direction = getClockSkewDirection({ ...measurement, serverTime: Date.parse(date), precision: DATE_HEADER_PRECISION });
	if (direction == null) return;
	if (!enabled) {
		if (pendingDirections.length < 3) pendingDirections.push(direction);
		return;
	}
	await acceptMeasurement(direction);
}

async function acceptMeasurement(direction: -1 | 0 | 1): Promise<void> {
	if (finished) return;
	samples++;
	if (direction === 1) serverAhead++;
	if (direction === -1) deviceAhead++;
	if (serverAhead < 2 && deviceAhead < 2) {
		if (samples >= 3) finished = true;
		return;
	}
	finished = true;
	try {
		// Lazy imports keep the shared API wrapper independent of UI initialization.
		const [{ alert }, { i18n }] = await Promise.all([import('@/os.js'), import('@/i18n.js')]);
		await alert({ type: 'warning', title: i18n.ts._clockSkewWarning.title, text: i18n.ts._clockSkewWarning.description });
	} catch {
		// Warning failures must not affect API calls or become unhandled rejections.
	}
}

/** Falls back to existing ping calls only when normal API traffic supplies too few samples. */
async function completeStartupMeasurements(): Promise<void> {
	if (finished) return;
	try {
		const { misskeyApi } = await import('@/utility/misskey-api.js');
		for (let attempt = 0; attempt < 3 && !finished; attempt++) {
			const controller = new AbortController();
			const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
			try {
				// The API wrapper observes Date; the response body is deliberately unused.
				await misskeyApi('ping', {}, null, controller.signal);
			} catch {
				// Offline and aborted requests must not interfere with startup.
			} finally {
				window.clearTimeout(timeout);
			}
		}
	} catch {
		// Failure to load the API wrapper must not become an unhandled rejection.
	}
}
