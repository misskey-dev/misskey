import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';
import AbuseUserReport from '../../../../models/abuse-user-report';
import { publishAdminStream } from '../../../../services/stream';
import { ApiError } from '../../error';
import { getUser } from '../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを迷惑なユーザーであると報告します。'
	},

	tags: ['users'],

	requireCredential: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		comment: {
			validator: $.str.range(1, 3000),
			desc: {
				'ja-JP': '迷惑行為の詳細'
			}
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '1acefcb5-0959-43fd-9685-b48305736cb5'
		},

		cannotReportYourself: {
			message: 'Cannot report yourself.',
			code: 'CANNOT_REPORT_YOURSELF',
			id: '1e13149e-b1e8-43cf-902e-c01dbfcb202f'
		},

		cannotReportAdmin: {
			message: 'Cannot report the admin.',
			code: 'CANNOT_REPORT_THE_ADMIN',
			id: '35e166f5-05fb-4f87-a2d5-adb42676d48f'
		}
	}
};

export default define(meta, async (ps, me) => {
	// Lookup user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	if (user._id.equals(me._id)) {
		throw new ApiError(meta.errors.cannotReportYourself);
	}

	if (user.isAdmin) {
		throw new ApiError(meta.errors.cannotReportAdmin);
	}

	const report = await AbuseUserReport.insert({
		createdAt: new Date(),
		userId: user._id,
		reporterId: me._id,
		comment: ps.comment
	});

	// Publish event to moderators
	setTimeout(async () => {
		const moderators = await User.find({
			$or: [{
				isAdmin: true
			}, {
				isModerator: true
			}]
		});

		for (const moderator of moderators) {
			publishAdminStream(moderator._id, 'newAbuseUserReport', {
				id: report._id,
				userId: report.userId,
				reporterId: report.reporterId,
				comment: report.comment
			});
		}
	}, 1);
});
