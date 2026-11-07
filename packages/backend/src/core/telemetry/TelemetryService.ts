/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { captureMessage, shutdownTelemetry, startSpan } from './telemetry-registry.js';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { TelemetryCaptureMessageOptions } from './adapters/TelemetryAdapter.js';

@Injectable()
export class TelemetryService implements OnApplicationShutdown {
	@bindThis
	public captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void {
		captureMessage(message, opts);
	}

	@bindThis
	public startSpan<T>(name: string, fn: () => T): T {
		return startSpan(name, fn);
	}

	@bindThis
	public async onApplicationShutdown(_signal?: string): Promise<void> {
		await shutdownTelemetry();
	}
}
