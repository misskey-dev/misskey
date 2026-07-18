/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { median } from 'diagnostics-shared/stats';
import type { BrowserDiagnostics } from '../types';

export function summarizeBrowserDiagnostics(samples: BrowserDiagnostics[]): BrowserDiagnostics {
	const medianOf = (select: (sample: BrowserDiagnostics) => number) => median(samples.map(select));

	return {
		pageErrorCount: medianOf(sample => sample.pageErrorCount),
		console: {
			log: medianOf(sample => sample.console.log),
			warning: medianOf(sample => sample.console.warning),
			error: medianOf(sample => sample.console.error),
			info: medianOf(sample => sample.console.info),
		},
	};
}
