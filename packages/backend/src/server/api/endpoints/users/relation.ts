/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

const relationSchema = v.object({
	id: mi.idString(),
	isFollowing: v.boolean(),
	hasPendingFollowRequestFromYou: v.boolean(),
	hasPendingFollowRequestToYou: v.boolean(),
	isFollowed: v.boolean(),
	isBlocking: v.boolean(),
	isBlocked: v.boolean(),
	isMuted: v.boolean(),
	isRenoteMuted: v.boolean(),
});

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'read:account',

	description: 'Show the different kinds of relations between the authenticated user and the specified user(s).',

	// NOTE: 判別子の無い oneOf (単体 or 配列) なので v.union + asOneOf で現行出力 (oneOf) を維持する
	res: v.pipe(
		v.union([
			relationSchema,
			v.array(relationSchema),
		]),
		mi.asOneOf(),
	),
} as const;

export const paramDef = v.object({
	// NOTE: 判別子の無い oneOf (単体 or 配列) なので v.union + asOneOf で現行出力 (oneOf) を維持する
	userId: v.pipe(
		v.union([
			mi.misskeyId(),
			v.array(mi.misskeyId()),
		]),
		mi.asOneOf(),
	),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return Array.isArray(ps.userId)
				? await this.userEntityService.getRelations(me.id, ps.userId).then(it => [...it.values()])
				: await this.userEntityService.getRelation(me.id, ps.userId).then(it => [it]);
		});
	}
}
