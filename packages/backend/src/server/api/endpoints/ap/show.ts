/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiNote } from '@/models/Note.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { isActor, isPost, getApId } from '@/core/activitypub/type.js';
import type { SchemaType } from '@/misc/json-schema.js';
import { ApResolverService } from '@/core/activitypub/ApResolverService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { MetaService } from '@/core/MetaService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,
	kind: 'read:account',

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	errors: {
		noSuchObject: {
			message: 'No such object.',
			code: 'NO_SUCH_OBJECT',
			id: 'dc94d745-1262-4e63-a17d-fecaa57efc82',
		},
	},

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				properties: {
					type: {
						type: 'string',
						optional: false, nullable: false,
						enum: ['User'],
					},
					object: {
						type: 'object',
						optional: false, nullable: false,
						ref: 'UserDetailedNotMe',
					},
				},
			},
			{
				type: 'object',
				properties: {
					type: {
						type: 'string',
						optional: false, nullable: false,
						enum: ['Note'],
					},
					object: {
						type: 'object',
						optional: false, nullable: false,
						ref: 'Note',
					},
				},
			},
		],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uri: { type: 'string' },
	},
	required: ['uri'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
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
			const object = await this.fetchAny(ps.uri, me);
			if (object) {
				return object;
			} else {
				throw new ApiError(meta.errors.noSuchObject);
			}
		});
	}

	/***
	 * URIからUserかNoteを解決する
	 */
	@bindThis
	private async fetchAny(uri: string, me: MiLocalUser | null | undefined): Promise<SchemaType<typeof meta['res']> | null> {
	// ブロックしてたら中断
		const fetchedMeta = await this.metaService.fetch();
		if (this.utilityService.isBlockedHost(fetchedMeta.blockedHosts, this.utilityService.extractDbHost(uri))) return null;

		let local = await this.mergePack(me, ...await Promise.all([
			this.apDbResolverService.getUserFromApId(uri),
			this.apDbResolverService.getNoteFromApId(uri),
		]));
		if (local != null) return local;

		// リモートから一旦オブジェクトフェッチ
		const resolver = this.apResolverService.createResolver();
		const object = await resolver.resolve(uri) as any;

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
	private async mergePack(me: MiLocalUser | null | undefined, user: MiUser | null | undefined, note: MiNote | null | undefined): Promise<SchemaType<typeof meta.res> | null> {
		if (user != null) {
			return {
				type: 'User',
				object: await this.userEntityService.pack(user, me, { detail: true }),
			};
		} else if (note != null) {
			try {
				const object = await this.noteEntityService.pack(note, me, { detail: true });

				return {
					type: 'Note',
					object,
				};
			} catch (e) {
				return null;
			}
		}

		return null;
	}
}
