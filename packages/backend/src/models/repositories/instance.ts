import { db } from '@/db/postgre.js';
import { Instance } from '@/models/entities/instance.js';
import { Packed } from '@/misc/schema.js';

export const InstanceRepository = db.getRepository(Instance).extend({
	async pack(
		instance: Instance,
	): Promise<Packed<'FederationInstance'>> {
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
			softwareName: instance.softwareName,
			softwareVersion: instance.softwareVersion,
			openRegistrations: instance.openRegistrations,
			name: instance.name,
			description: instance.description,
			maintainerName: instance.maintainerName,
			maintainerEmail: instance.maintainerEmail,
			iconUrl: instance.iconUrl,
			infoUpdatedAt: instance.infoUpdatedAt ? instance.infoUpdatedAt.toISOString() : null,
		};
	},

	packMany(
		instances: Instance[],
	) {
		return Promise.all(instances.map(x => this.pack(x)));
	},
});
