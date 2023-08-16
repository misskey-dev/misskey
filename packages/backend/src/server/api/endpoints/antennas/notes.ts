/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NotesRepository, AntennasRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { DI } from '@/di-symbols.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['antennas', 'account', 'notes'],

	requireCredential: true,

	kind: 'read:account',

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: '850926e0-fd3b-49b6-b69a-b28a5dbd82fe',
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		antennaId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['antennaId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private idService: IdService,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private noteReadService: NoteReadService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const antenna = await this.antennasRepository.findOneBy({
				id: ps.antennaId,
				userId: me.id,
			});

			if (antenna == null) {
				throw new ApiError(meta.errors.noSuchAntenna);
			}

			this.antennasRepository.update(antenna.id, {
				isActive: true,
				lastUsedAt: new Date(),
			});

			const limit = ps.limit + (ps.untilId ? 1 : 0) + (ps.sinceId ? 1 : 0); // untilIdに指定したものも含まれるため+1
			const noteIdsRes = await this.redisClient.xrevrange(
				`antennaTimeline:${antenna.id}`,
				ps.untilId ? this.idService.parse(ps.untilId).date.getTime() : ps.untilDate ?? '+',
				ps.sinceId ? this.idService.parse(ps.sinceId).date.getTime() : ps.sinceDate ?? '-',
				'COUNT', limit);

			if (noteIdsRes.length === 0) {
				return [];
			}

			const noteIds = noteIdsRes.map(x => x[1][1]).filter(x => x !== ps.untilId && x !== ps.sinceId);

			if (noteIds.length === 0) {
				return [];
			}

			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateMutedUserQuery(query, me);
			this.queryService.generateBlockedUserQuery(query, me);

			const notes = await query.getMany();
			notes.sort((a, b) => a.id > b.id ? -1 : 1);

			if (notes.length > 0) {
				this.noteReadService.read(me.id, notes);
			}

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
