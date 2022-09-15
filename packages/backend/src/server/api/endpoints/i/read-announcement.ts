import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/services/IdService.js';
import type { Users , AnnouncementReads, Announcements } from '@/models/index.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { UserEntityService } from '@/services/entities/UserEntityService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchAnnouncement: {
			message: 'No such announcement.',
			code: 'NO_SUCH_ANNOUNCEMENT',
			id: '184663db-df88-4bc2-8b52-fb85f0681939',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		announcementId: { type: 'string', format: 'misskey:id' },
	},
	required: ['announcementId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('announcementsRepository')
		private announcementsRepository: typeof Announcements,

		@Inject('announcementReadsRepository')
		private announcementReadsRepository: typeof AnnouncementReads,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check if announcement exists
			const announcement = await this.announcementsRepository.findOneBy({ id: ps.announcementId });

			if (announcement == null) {
				throw new ApiError(meta.errors.noSuchAnnouncement);
			}

			// Check if already read
			const read = await this.announcementReadsRepository.findOneBy({
				announcementId: ps.announcementId,
				userId: me.id,
			});

			if (read != null) {
				return;
			}

			// Create read
			await this.announcementReadsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				announcementId: ps.announcementId,
				userId: me.id,
			});

			if (!await this.userEntityService.getHasUnreadAnnouncement(me.id)) {
				this.globalEventService.publishMainStream(me.id, 'readAllAnnouncements');
			}
		});
	}
}
