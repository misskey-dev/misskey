import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import User, { pack, ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	requireCredential: false,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},
	}
};

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Lookup user
	const user = await User.findOne({
		_id: ps.userId
	}, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	// Fetch recent notes
	const recentNotes = await Note.find({
		userId: user._id,
		replyId: {
			$exists: true,
			$ne: null
		}
	}, {
		sort: {
			_id: -1
		},
		limit: 1000,
		fields: {
			_id: false,
			replyId: true
		}
	});

	// 投稿が少なかったら中断
	if (recentNotes.length === 0) {
		return res([]);
	}

	const replyTargetNotes = await Note.find({
		_id: {
			$in: recentNotes.map(p => p.replyId)
		},
		userId: {
			$ne: user._id
		}
	}, {
		fields: {
			_id: false,
			userId: true
		}
	});

	const repliedUsers: any = {};

	// Extract replies from recent notes
	replyTargetNotes.forEach(note => {
		const userId = note.userId.toString();
		if (repliedUsers[userId]) {
			repliedUsers[userId]++;
		} else {
			repliedUsers[userId] = 1;
		}
	});

	// Calc peak
	let peak = 0;
	Object.keys(repliedUsers).forEach(user => {
		if (repliedUsers[user] > peak) peak = repliedUsers[user];
	});

	// Sort replies by frequency
	const repliedUsersSorted = Object.keys(repliedUsers).sort((a, b) => repliedUsers[b] - repliedUsers[a]);

	// Extract top replied users
	const topRepliedUsers = repliedUsersSorted.slice(0, ps.limit);

	// Make replies object (includes weights)
	const repliesObj = await Promise.all(topRepliedUsers.map(async (user) => ({
		user: await pack(user, me, { detail: true }),
		weight: repliedUsers[user] / peak
	})));

	res(repliesObj);
});
