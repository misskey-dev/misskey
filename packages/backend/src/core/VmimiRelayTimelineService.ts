/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';

type VmimiInstanceList = { Url: string; }[];

// one day
const UpdateInterval = 1000 * 60 * 60 * 24;
const RetryInterval = 1000 * 60 * 60 * 6;

@Injectable()
export class VmimiRelayTimelineService {
	instanceHosts: Set<string>;
	instanceHostsArray: string[];
	nextUpdate: number;
	updatePromise: Promise<void> | null;
	private logger: Logger;

	constructor(
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
	) {
		// Initialize with
		this.instanceHosts = new Set<string>([]);
		this.instanceHostsArray = [];
		this.nextUpdate = 0;
		this.updatePromise = null;

		this.logger = this.loggerService.getLogger('vmimi');

		this.checkForUpdateInstanceList();
	}

	@bindThis
	checkForUpdateInstanceList() {
		if (this.updatePromise == null && this.nextUpdate < Date.now()) {
			this.updatePromise = this.updateInstanceList().finally(() => this.updatePromise = null);
		}
	}

	@bindThis
	async updateInstanceList() {
		try {
			this.logger.info('Updating instance list');
			const instanceList = await this.httpRequestService.getJson<VmimiInstanceList>('https://relay.virtualkemomimi.net/api/servers');
			this.instanceHostsArray = instanceList.map(i => new URL(i.Url).host);
			this.instanceHosts = new Set<string>(this.instanceHostsArray);
			this.nextUpdate = Date.now() + UpdateInterval;
			this.logger.info(`Got instance list: ${this.instanceHostsArray}`);
		} catch (e) {
			this.logger.error('Failed to update instance list', e as any);
			this.nextUpdate = Date.now() + RetryInterval;
			setTimeout(() => this.checkForUpdateInstanceList(), RetryInterval + 5);
		}
	}

	@bindThis
	isRelayedInstance(host: string | null): boolean {
		this.checkForUpdateInstanceList();
		// assuming the current instance is joined to the i relay
		if (host == null) return true;
		return this.instanceHosts.has(host);
	}

	get hostNames (): string[] {
		this.checkForUpdateInstanceList();
		return this.instanceHostsArray;
	}
}
