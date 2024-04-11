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

@Injectable()
export class VmimiRelayTimelineService {
	instanceHosts: Set<string>;
	instanceHostsArray: string[];
	lastUpdated: number;
	updatePromise: Promise<void> | null;
	private logger: Logger;

	constructor(
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
	) {
		// Initialize with
		this.instanceHosts = new Set<string>([]);
		this.instanceHostsArray = [];
		this.lastUpdated = 0;
		this.updatePromise = null;

		this.logger = this.loggerService.getLogger('vmimi');

		this.checkForUpdateInstanceList();
	}

	@bindThis
	checkForUpdateInstanceList() {
		// one day
		const UpdateInterval = 60 * 60 * 24;

		if (this.updatePromise == null && this.lastUpdated + UpdateInterval < Date.now()) {
			this.updatePromise = this.updateInstanceList().then(() => {
				this.updatePromise = null;
			});
		}
	}

	@bindThis
	async updateInstanceList() {
		this.logger.info('Updating instance list');
		const instanceList = await this.httpRequestService.getJson<VmimiInstanceList>('https://relay.virtualkemomimi.net/api/servers');
		this.instanceHostsArray = instanceList.map(i => new URL(i.Url).host);
		this.instanceHosts = new Set<string>(this.instanceHostsArray);
		this.lastUpdated = Date.now();
		this.logger.info(`Got instance list: ${this.instanceHostsArray}`);
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

	@bindThis
	generateFilterQuery(query: SelectQueryBuilder<any>) {
		query.andWhere(new Brackets(qb => {
			qb
				.andWhere('note.userHost IS NULL')
				.orWhere('note.userHost IN (:...vmimiRelayInstances)', { vmimiRelayInstances: this.hostNames });
		}));
	}
}
