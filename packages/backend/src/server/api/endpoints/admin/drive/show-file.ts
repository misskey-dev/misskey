/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { DriveFilesRepository, UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:drive',

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240',
		},
	},

	res: v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		createdAt: mi.dateTimeString(),
		userId: v.nullable(mi.example(mi.idString(), 'xxxxxxxxxx')),
		userHost: v.nullable(v.pipe(v.string(), v.description('The local host is represented with `null`.'))),
		md5: v.pipe(v.string(), mi.format('md5'), mi.example('15eca7fba0480996e2245f5185bf39f2')),
		name: mi.example(v.string(), '192.jpg'),
		type: mi.example(v.string(), 'image/jpeg'),
		size: mi.example(v.number(), 51469),
		comment: v.nullable(v.string()),
		blurhash: v.nullable(v.string()),
		properties: v.object({
			width: v.optional(v.number()),
			height: v.optional(v.number()),
			orientation: v.optional(v.number()),
			avgColor: v.optional(v.string()),
		}),
		storedInternal: v.nullable(mi.example(v.boolean(), true)),
		url: v.nullable(mi.urlString()),
		thumbnailUrl: v.nullable(mi.urlString()),
		webpublicUrl: v.nullable(mi.urlString()),
		accessKey: v.nullable(v.string()),
		thumbnailAccessKey: v.nullable(v.string()),
		webpublicAccessKey: v.nullable(v.string()),
		uri: v.nullable(v.string()),
		src: v.nullable(v.string()),
		folderId: v.nullable(mi.example(mi.idString(), 'xxxxxxxxxx')),
		isSensitive: v.boolean(),
		isLink: v.boolean(),
		maybeSensitive: v.boolean(),
		maybePorn: v.boolean(),
		requestIp: v.nullable(v.string()),
		requestHeaders: v.nullable(mi.anyObject()),
	}),
} as const;

export const paramDef = v.union([
	v.object({
		fileId: mi.misskeyId(),
	}),
	v.object({
		url: v.string(),
	}),
]);

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy(
				'fileId' in ps
					? { id: ps.fileId }
					: [{ url: ps.url }, { thumbnailUrl: ps.url }, { webpublicUrl: ps.url }],
			);

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			const owner = file.userId ? await this.usersRepository.findOneByOrFail({
				id: file.userId,
			}) : null;

			const iAmModerator = await this.roleService.isModerator(me);
			const ownerIsModerator = owner ? await this.roleService.isModerator(owner) : false;

			return {
				id: file.id,
				userId: file.userId,
				userHost: file.userHost,
				isLink: file.isLink,
				maybePorn: file.maybePorn,
				maybeSensitive: file.maybeSensitive,
				isSensitive: file.isSensitive,
				folderId: file.folderId,
				src: file.src,
				uri: file.uri,
				webpublicAccessKey: file.webpublicAccessKey,
				thumbnailAccessKey: file.thumbnailAccessKey,
				accessKey: file.accessKey,
				webpublicType: file.webpublicType,
				webpublicUrl: file.webpublicUrl,
				thumbnailUrl: file.thumbnailUrl,
				url: file.url,
				storedInternal: file.storedInternal,
				properties: file.properties,
				blurhash: file.blurhash,
				comment: file.comment,
				size: file.size,
				type: file.type,
				name: file.name,
				md5: file.md5,
				createdAt: this.idService.parse(file.id).date.toISOString(),
				requestIp: iAmModerator ? file.requestIp : null,
				requestHeaders: iAmModerator && !ownerIsModerator ? file.requestHeaders : null,
			};
		});
	}
}
