/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { GetterService } from '@/server/api/GetterService.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,
} as const;

export const paramDef = v.object({
	userId: mi.misskeyId(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private getterService: GetterService,
		private apPersonService: ApPersonService,
	) {
		super(meta, paramDef, async (ps) => {
			const user = await this.getterService.getRemoteUser(ps.userId);
			await this.apPersonService.updatePerson(user.uri!);
		});
	}
}
