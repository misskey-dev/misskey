import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ScheduledNotesRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiScheduledNote } from '@/models/ScheduledNote.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class ScheduledNoteEntityService {
	constructor(
		@Inject(DI.scheduledNotesRepository)
		private scheduledNotesRepository: ScheduledNotesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiScheduledNote['id'] | MiScheduledNote,
		me: { id: MiUser['id'] },
	) : Promise<Packed<'NoteDraft'>> {
		const item = typeof src === 'object' ? src : await this.scheduledNotesRepository.findOneByOrFail({ id: src, userId: me.id });

		return {
			id: item.id,
			updatedAt: item.createdAt.toISOString(),
			scheduledAt: item.scheduledAt?.toISOString() ?? null,
			reason: item.reason ?? undefined,
			channel: item.draft.channel ? {
				id: item.draft.channel.id,
				name: item.draft.channel.name,
			} : undefined,
			renote: item.draft.renote ? {
				id: item.draft.renote.id,
				text: (item.draft.renote.cw ?? item.draft.renote.text)?.substring(0, 100) ?? null,
				user: {
					id: item.draft.renote.userId,
					username: item.draft.renote.user!.username,
					host: item.draft.renote.user!.host,
				},
			} : undefined,
			reply: item.draft.reply ? {
				id: item.draft.reply.id,
				text: (item.draft.reply.cw ?? item.draft.reply.text)?.substring(0, 100) ?? null,
				user: {
					id: item.draft.reply.userId,
					username: item.draft.reply.user!.username,
					host: item.draft.reply.user!.host,
				},
			} : undefined,
			data: {
				text: item.draft.text ?? null,
				useCw: !!item.draft.cw,
				cw: item.draft.cw ?? null,
				visibility: item.draft.visibility as 'public' | 'followers' | 'home' | 'specified',
				localOnly: item.draft.localOnly ?? false,
				files: item.draft.files ? await this.driveFileEntityService.packMany(item.draft.files, me) : [],
				poll: item.draft.poll ? { ...item.draft.poll, expiresAt: item.draft.poll.expiresAt?.getTime() ?? null, expiredAfter: null } : null,
				visibleUserIds: item.draft.visibility === 'specified' ? item.draft.visibleUsers?.map(x => x.id) : undefined,
			},
		};
	}

	@bindThis
	public async packMany(
		drafts: (MiScheduledNote['id'] | MiScheduledNote)[],
		me: { id: MiUser['id'] },
	) : Promise<Packed<'NoteDraft'>[]> {
		return (await Promise.allSettled(drafts.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'NoteDraft'>>).value);
	}
}
