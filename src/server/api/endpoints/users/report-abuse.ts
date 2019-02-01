import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User from '../../../../models/user';
import AbuseUserReport from '../../../../models/abuse-user-report';
import { publishAdminStream } from '../../../../stream';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを迷惑なユーザーであると報告します。'
	},

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
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	// Lookup user
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user === null) {
		return rej('user not found');
	}

	if (user._id.equals(me._id)) {
		return rej('cannot report yourself');
	}

	if (user.isAdmin) {
		return rej('cannot report admin');
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

	res();
}));
