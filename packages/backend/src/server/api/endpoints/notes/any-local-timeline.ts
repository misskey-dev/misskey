/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { ApResolverService } from '@/core/activitypub/ApResolverService.js';
import { getApId, isActor, isPost } from '@/core/activitypub/type.js';
import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import type { NotesRepository } from '@/models/_.js';
import { MiNote, MiUser } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { MiLocalUser } from '@/models/User.js';
import { SchemaType } from '@/misc/json-schema.js';
import { UtilityService } from '@/core/UtilityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		hostIsNull: {
			message: 'Host is null',
			code: 'HOST_NULL',
			id: 'PRSMSK-ANY-LTL-0001',
		},

		bothWithRepliesAndWithFiles: {
			message: 'Specifying both withReplies and withFiles is not supported',
			code: 'BOTH_WITH_REPLIES_AND_WITH_FILES',
			id: 'dd9c8400-1cb5-4eef-8a31-200c5f933793',
		},
		remoteTokenIsNull: {
			message: 'remoteToken is null',
			code: 'REMOTE_TOKEN_NULL',
			id: 'PRSMSK-ANY-LTL-0002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		withFiles: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
		withReplies: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		allowPartial: { type: 'boolean', default: false }, // true is recommended but for compatibility false by default
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		host: { type: 'string' },
		remoteToken: { type: 'string' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		private idService: IdService,
		private federatedInstanceService: FederatedInstanceService,
		private httpRequestService: HttpRequestService,
		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private metaService: MetaService,
		private apResolverService: ApResolverService,
		private apDbResolverService: ApDbResolverService,
		private apPersonService: ApPersonService,
		private apNoteService: ApNoteService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);
			if (ps.host === undefined) throw new ApiError(meta.errors.hostIsNull);
			if (ps.remoteToken === undefined) throw new ApiError(meta.errors.remoteTokenIsNull);
			const i = await this.federatedInstanceService.fetch(ps.host);
			const noteIds = [];

			if (i.softwareName === 'misskey') {
				const remoteTimeline: string[] = await (await this.httpRequestService.send('https://' + ps.host + '/api/notes/local-timeline', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						i: ps.remoteToken,
						withFiles: ps.withFiles,
						withRenotes: ps.withRenotes,
						withReplies: ps.withReplies,
						limit: 30,
					}),
				})).json() as string[];

				if (remoteTimeline.length > 0) {
					for (const note of remoteTimeline) {
						const uri = `https://${ps.host}/notes/${note.id}`;
						const note_ = await this.fetchAny(uri, me);
						if (note_ == null) continue;
						noteIds.push(note_.id);
					}
				}

				let notes = await this.notesRepository.findBy({ id: In(noteIds) });
				let packedNote: any[] = await this.noteEntityService.packMany(notes, me, { detail: true });
				if (untilId) {
					let lastRemoteId;
					const lastUri = packedNote[packedNote.length - 1].uri;
					lastRemoteId = lastUri.split('/')[lastUri.split('/').length - 1];
					do {
						const remoteTimeline: string[] = await (await this.httpRequestService.send('https://' + ps.host + '/api/notes/local-timeline', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								i: ps.remoteToken,
								withFiles: ps.withFiles,
								withRenotes: ps.withRenotes,
								withReplies: ps.withReplies,
								untilId: lastRemoteId,
								limit: 30,
							}),
						})).json() as string[];

						if (remoteTimeline.length > 0) {
							for (const note of remoteTimeline) {
								const uri = `https://${ps.host}/notes/${note.id}`;
								const note_ = await this.fetchAny(uri, me);
								if (note_ == null) continue;
								//noteIds.push(note_.id);
								lastRemoteId = note_.id;
								if (lastRemoteId === ps.untilId) {
									break;
								}
							}
						}
					} while (lastRemoteId !== ps.untilId);
					const remoteTimeline: string[] = await (await this.httpRequestService.send('https://' + ps.host + '/api/notes/local-timeline', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							i: ps.remoteToken,
							withFiles: ps.withFiles,
							withRenotes: ps.withRenotes,
							withReplies: ps.withReplies,
							untilId: lastRemoteId,
							limit: 30,
						}),
					})).json() as string[];

					if (remoteTimeline.length > 0) {
						for (const note of remoteTimeline) {
							const uri = `https://${ps.host}/notes/${note.id}`;
							const note_ = await this.fetchAny(uri, me);
							if (note_ == null) continue;
							noteIds.push(note_.id);
						}
					}
				}

				notes = await this.notesRepository.findBy({ id: In(noteIds) });
				packedNote = await this.noteEntityService.packMany(notes, me, { detail: true });
				return packedNote.reverse();
			}
		});
	}
	@bindThis
	private async fetchAny(uri: string, me: MiLocalUser | null | undefined) {
		// ブロックしてたら中断
		const fetchedMeta = await this.metaService.fetch();
		if (this.utilityService.isBlockedHost(fetchedMeta.blockedHosts, this.utilityService.extractDbHost(uri))) return null;

		let local = await this.mergePack(me, ...await Promise.all([
			this.apDbResolverService.getUserFromApId(uri),
			this.apDbResolverService.getNoteFromApId(uri),
		]));
		if (local != null) return local;

		// リモートから一旦オブジェクトフェッチ
		let object;
		try {
			const resolver = this.apResolverService.createResolver();
			object = await resolver.resolve(uri) as any;
		} catch (e) {
			return null;
		}
		if (!object) return null;
		// /@user のような正規id以外で取得できるURIが指定されていた場合、ここで初めて正規URIが確定する
		// これはDBに存在する可能性があるため再度DB検索
		if (uri !== object.id) {
			local = await this.mergePack(me, ...await Promise.all([
				this.apDbResolverService.getUserFromApId(object.id),
				this.apDbResolverService.getNoteFromApId(object.id),
			]));
			if (local != null) return local;
		}

		return await this.mergePack(
			me,
			isActor(object) ? await this.apPersonService.createPerson(getApId(object)) : null,
			isPost(object) ? await this.apNoteService.createNote(getApId(object), undefined, true) : null,
		);
	}

	@bindThis
	private async mergePack(me: MiLocalUser | null | undefined, user: MiUser | null | undefined, note: MiNote | null | undefined) {
		if (note != null) {
			try {
				const object = await this.noteEntityService.pack(note, me, { detail: true });

				return object;
			} catch (e) {
				return null;
			}
		}

		return null;
	}
}
