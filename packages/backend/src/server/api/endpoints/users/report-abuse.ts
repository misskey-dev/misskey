import * as sanitizeHtml from 'sanitize-html';
import define from '../../define.js';
import { publishAdminStream } from '@/services/stream.js';
import { ApiError } from '../../error.js';
import { getUser } from '../../common/getters.js';
import { AbuseUserReports, Users } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { sendEmail } from '@/services/send-email.js';
import { fetchMeta } from '@/misc/fetch-meta.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,

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

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Lookup user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	if (user.id === me.id) {
		throw new ApiError(meta.errors.cannotReportYourself);
	}

	if (user.isAdmin) {
		throw new ApiError(meta.errors.cannotReportAdmin);
	}

	const report = await AbuseUserReports.insert({
		id: genId(),
		createdAt: new Date(),
		targetUserId: user.id,
		targetUserHost: user.host,
		reporterId: me.id,
		reporterHost: null,
		comment: ps.comment,
	}).then(x => AbuseUserReports.findOneByOrFail(x.identifiers[0]));

	// Publish event to moderators
	setImmediate(async () => {
		const moderators = await Users.find({
			where: [{
				isAdmin: true,
			}, {
				isModerator: true,
			}],
		});

		for (const moderator of moderators) {
			publishAdminStream(moderator.id, 'newAbuseUserReport', {
				id: report.id,
				targetUserId: report.targetUserId,
				reporterId: report.reporterId,
				comment: report.comment,
			});
		}

		const meta = await fetchMeta();
		if (meta.email) {
			sendEmail(meta.email, 'New abuse report',
				sanitizeHtml(ps.comment),
				sanitizeHtml(ps.comment));
		}
	});
});
