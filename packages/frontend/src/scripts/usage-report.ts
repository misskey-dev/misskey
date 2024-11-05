/* eslint-disable id-denylist */
// buffering usage report data for 1 minute, then sending it to the server
// POST /api/usage [ { t: number, e: string, i: string, a: string } ]
// t: timestamp
// e: event type
// i: event initiator
// a: action

import { generateClientTransactionId } from '@/scripts/misskey-api.js';
import { miLocalStorage } from '@/local-storage.js';
import { GtagConsentParams } from 'vue-gtag';
import { instance } from '@/instance.js';

export interface UsageReport {
	t: number;
	e: string;
	i: string;
	a: string;
}

let disableUsageReport = !instance.googleAnalyticsId;
const usageReportBuffer: UsageReport[] = [];
let usageReportBufferTimer: number | null = null;

export function usageReport(data: UsageReport) {
	if (disableUsageReport) return;

	if (usageReportBuffer.length > 0) {
		const last = usageReportBuffer[usageReportBuffer.length - 1];
		if (last.t === data.t && last.e === data.e && last.a === data.a) return;
	}

	usageReportBuffer.push(data);
	if (usageReportBufferTimer === null) {
		usageReportBufferTimer = window.setTimeout(() => {
			sendUsageReport();
		}, 60 * 1000);
	}
}

export function sendUsageReport() {
	if (usageReportBuffer.length === 0) return;
	const data = usageReportBuffer.splice(0, usageReportBuffer.length);
	usageReportBufferTimer = null;

	if ((miLocalStorage.getItemAsJson('gtagConsent') as GtagConsentParams)?.ad_user_data !== 'granted') {
		console.log('Usage report is not sent because the user has not consented to sharing data about ad interactions.');
		disableUsageReport = true;
		return;
	}

	window.fetch('/api/usage', {
		method: 'POST',
		body: JSON.stringify(data),
		cache: 'no-cache',
		headers: {
			'Content-Type': 'application/json',
			'X-Client-Transaction-Id': generateClientTransactionId('misskey'),
		},
	});
}
