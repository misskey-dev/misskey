import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { InstancesRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Instance } from '@/models/entities/Instance.js';
import { MetaService } from '../MetaService.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class InstanceEntityService {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private metaService: MetaService,
	) {
	}

	public async pack(
		instance: Instance,
	): Promise<Packed<'FederationInstance'>> {
		const meta = await this.metaService.fetch();
		return {
			id: instance.id,
			caughtAt: instance.caughtAt.toISOString(),
			host: instance.host,
			usersCount: instance.usersCount,
			notesCount: instance.notesCount,
			followingCount: instance.followingCount,
			followersCount: instance.followersCount,
			latestRequestSentAt: instance.latestRequestSentAt ? instance.latestRequestSentAt.toISOString() : null,
			lastCommunicatedAt: instance.lastCommunicatedAt.toISOString(),
			isNotResponding: instance.isNotResponding,
			isSuspended: instance.isSuspended,
			isBlocked: meta.blockedHosts.includes(instance.host),
			softwareName: instance.softwareName,
			softwareVersion: instance.softwareVersion,
			openRegistrations: instance.openRegistrations,
			name: instance.name,
			description: instance.description,
			maintainerName: instance.maintainerName,
			maintainerEmail: instance.maintainerEmail,
			iconUrl: instance.iconUrl,
			faviconUrl: instance.faviconUrl,
			themeColor: instance.themeColor,
			infoUpdatedAt: instance.infoUpdatedAt ? instance.infoUpdatedAt.toISOString() : null,
		};
	}

	public packMany(
		instances: Instance[],
	) {
		return Promise.all(instances.map(x => this.pack(x)));
	}
}

