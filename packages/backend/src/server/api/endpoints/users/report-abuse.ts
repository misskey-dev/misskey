/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { RoleService } from '@/core/RoleService.js';
import { AbuseReportService } from '@/core/AbuseReportService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'write:report-abuse',

	description: 'File a report.',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '1acefcb5-0959-43fd-9685-b48305736cb5',
		},

		cannotReportYourself: {
			message: 'Cannot report yourself.',
			code: 'CANNOT_REPORT_YOURSELF',
			id: '1e13149e-b1e8-43cf-902e-c01dbfcb202f',
		},

		cannotReportAdmin: {
			message: 'Cannot report the admin.',
			code: 'CANNOT_REPORT_THE_ADMIN',
			id: '35e166f5-05fb-4f87-a2d5-adb42676d48f',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		comment: { type: 'string', minLength: 1, maxLength: 2048 },
	},
	required: ['userId', 'comment'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private getterService: GetterService,
		private roleService: RoleService,
		private abuseReportService: AbuseReportService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Lookup user
			const targetUser = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			if (targetUser.id === me.id) {
				throw new ApiError(meta.errors.cannotReportYourself);
			}

			if (await this.roleService.isAdministrator(targetUser)) {
				throw new ApiError(meta.errors.cannotReportAdmin);
			}

			await this.abuseReportService.report([{
				targetUserId: targetUser.id,
				targetUserHost: targetUser.host,
				reporterId: me.id,
				reporterHost: null,
				comment: ps.comment,
			}]);
		});
	}
}
