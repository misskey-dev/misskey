/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiNote } from '@/models/Note.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { isActor, isPost, getApId } from '@/core/activitypub/type.js';
import type { SchemaType } from '@/misc/json-schema.js';
import { ApResolverService } from '@/core/activitypub/ApResolverService.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { AP_RESOLVER_ERRORS } from '@/core/activitypub/errors.js';
import { FetchAllowSoftFailMask } from '@/core/activitypub/misc/check-against-url.js';
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
		federationNotAllowed: {
			message: 'Federation for this host is not allowed.',
			code: 'FEDERATION_NOT_ALLOWED',
			id: '974b799e-1a29-4889-b706-18d4dd93e266',
		},
		uriInvalid: {
			message: 'URI is invalid.',
			code: 'URI_INVALID',
			id: '1a5eab56-e47b-48c2-8d5e-217b897d70db',
		},
		requestFailed: {
			message: 'Request failed.',
			code: 'REQUEST_FAILED',
			id: '81b539cf-4f57-4b29-bc98-032c33c0792e',
		},
		responseInvalid: {
			message: 'Response from remote server is invalid.',
			code: 'RESPONSE_INVALID',
			id: '70193c39-54f3-4813-82f0-70a680f7495b',
		},
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
		if (!this.utilityService.isFederationAllowedUri(uri)) {
			throw new ApiError(meta.errors.federationNotAllowed);
		}

		let local = await this.mergePack(me, ...await Promise.all([
			this.apDbResolverService.getUserFromApId(uri),
			this.apDbResolverService.getNoteFromApId(uri),
		]));
		if (local != null) return local;

		const host = this.utilityService.extractDbHost(uri);

		// local object, not found in db? fail
		if (this.utilityService.isSelfHost(host)) return null;

		// リモートから一旦オブジェクトフェッチ
		const resolver = await this.apResolverService.createResolver();
		// allow ap/show exclusively to lookup URLs that are cross-origin or non-canonical (like https://alice.example.com/@bob@bob.example.com -> https://bob.example.com/@bob)
		const object = await resolver.resolve(uri, FetchAllowSoftFailMask.CrossOrigin | FetchAllowSoftFailMask.NonCanonicalId).catch((err) => {
			if (err instanceof IdentifiableError) {
				switch (err.id) {
					// resolve
					case AP_RESOLVER_ERRORS.URL_WITH_FRAGMENT.id:
						throw new ApiError(meta.errors.uriInvalid);
					case AP_RESOLVER_ERRORS.ALREADY_RESOLVED.id:
					case AP_RESOLVER_ERRORS.RECURSION_LIMIT.id:
						throw new ApiError(meta.errors.requestFailed);
					case AP_RESOLVER_ERRORS.INSTANCE_BLOCKED.id:
						throw new ApiError(meta.errors.federationNotAllowed);
					case AP_RESOLVER_ERRORS.INVALID_RESPONSE.id:
						throw new ApiError(meta.errors.responseInvalid);

					// resolveLocal
					case AP_RESOLVER_ERRORS.NOT_LOCAL.id:
						throw new ApiError(meta.errors.uriInvalid);
					case AP_RESOLVER_ERRORS.INVALID_FOLLOW_REQUEST_ID.id:
					case AP_RESOLVER_ERRORS.FOLLOWER_OR_FOLLOWEE_NOT_FOUND.id:
						throw new ApiError(meta.errors.noSuchObject);
					case AP_RESOLVER_ERRORS.UNHANDLED_TYPE.id:
						throw new ApiError(meta.errors.responseInvalid);
				}
			}

			throw new ApiError(meta.errors.requestFailed);
		});

		if (object.id == null) {
			throw new ApiError(meta.errors.responseInvalid);
		}

		// /@user のような正規id以外で取得できるURIが指定されていた場合、ここで初めて正規URIが確定する
		// これはDBに存在する可能性があるため再度DB検索
		if (uri !== object.id) {
			local = await this.mergePack(me, ...await Promise.all([
				this.apDbResolverService.getUserFromApId(object.id),
				this.apDbResolverService.getNoteFromApId(object.id),
			]));
			if (local != null) return local;
		}

		// 同一ユーザーの情報を再度処理するので、使用済みのresolverを再利用してはいけない
		return await this.mergePack(
			me,
			isActor(object) ? await this.apPersonService.createPerson(getApId(object)) : null,
			isPost(object) ? await this.apNoteService.createNote(getApId(object), undefined, undefined, true) : null,
		);
	}

	@bindThis
	private async mergePack(me: MiLocalUser | null | undefined, user: MiUser | null | undefined, note: MiNote | null | undefined): Promise<SchemaType<typeof meta.res> | null> {
		if (user != null) {
			return {
				type: 'User',
				object: await this.userEntityService.pack(user, me, { schema: 'UserDetailedNotMe' }),
			};
		} else if (note != null) {
			try {
				const object = await this.noteEntityService.pack(note, me, { detail: true });

				return {
					type: 'Note',
					object,
				};
			} catch (_) {
				return null;
			}
		}

		return null;
	}
}
