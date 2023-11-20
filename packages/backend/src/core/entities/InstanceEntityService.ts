/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Packed } from '@/misc/json-schema.js';
import type { MiInstance } from '@/models/Instance.js';
import { MetaService } from '@/core/MetaService.js';
import { bindThis } from '@/decorators.js';
import { UtilityService } from '../UtilityService.js';

@Injectable()
export class InstanceEntityService {
	constructor(
		private metaService: MetaService,

		private utilityService: UtilityService,
	) {
	}

	@bindThis
	public async pack(
		instance: MiInstance,
	): Promise<Packed<'FederationInstance'>> {
		const meta = await this.metaService.fetch();
		return {
			id: instance.id,
			firstRetrievedAt: instance.firstRetrievedAt.toISOString(),
			host: instance.host,
			usersCount: instance.usersCount,
			notesCount: instance.notesCount,
			followingCount: instance.followingCount,
			followersCount: instance.followersCount,
			isNotResponding: instance.isNotResponding,
			isSuspended: instance.isSuspended,
			isBlocked: this.utilityService.isBlockedHost(meta.blockedHosts, instance.host),
			softwareName: instance.softwareName,
			softwareVersion: instance.softwareVersion,
			openRegistrations: instance.openRegistrations,
			name: instance.name,
			description: instance.description,
			maintainerName: instance.maintainerName,
			maintainerEmail: instance.maintainerEmail,
			isSilenced: this.utilityService.isSilencedHost(meta.silencedHosts, instance.host),
			iconUrl: instance.iconUrl,
			faviconUrl: instance.faviconUrl,
			themeColor: instance.themeColor,
			infoUpdatedAt: instance.infoUpdatedAt ? instance.infoUpdatedAt.toISOString() : null,
			latestRequestReceivedAt: instance.latestRequestReceivedAt ? instance.latestRequestReceivedAt.toISOString() : null,
		};
	}

	@bindThis
	public packMany(
		instances: MiInstance[],
	) {
		return Promise.all(instances.map(x => this.pack(x)));
	}
}

