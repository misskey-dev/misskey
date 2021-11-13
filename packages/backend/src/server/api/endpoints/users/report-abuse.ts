import $ from 'cafy';
import * as sanitizeHtml from 'sanitize-html';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { publishAdminStream } from '@/services/stream';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';
import { AbuseUserReports, Users } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { sendEmail } from '@/services/send-email';
import { fetchMeta } from '@/misc/fetch-meta';

export const meta = {
	tags: ['users'],

	requireCredential: true as const,

	params: {
		userId: {
			validator: $.type(ID),
		},

		comment: {
			validator: $.str.range(1, 2048),
		},
	},

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
};

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
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

	const report = await AbuseUserReports.save({
		id: genId(),
		createdAt: new Date(),
		targetUserId: user.id,
		targetUserHost: user.host,
		reporterId: me.id,
		reporterHost: null,
		comment: ps.comment,
	});

	// Publish event to moderators
	setTimeout(async () => {
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
	}, 1);
});
