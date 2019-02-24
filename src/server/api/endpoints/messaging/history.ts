import $ from 'cafy';
import Mute from '../../../../models/mute';
import Message, { pack, IMessagingMessage } from '../../../../models/messaging-message';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'Messagingの履歴を取得します。',
		'en-US': 'Show messaging history.'
	},

	tags: ['messaging'],

	requireCredential: true,

	kind: 'messaging-read',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'MessagingMessage',
		},
	},
};

export default define(meta, async (ps, user) => {
	const mute = await Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false }
	});

	const history: IMessagingMessage[] = [];

	for (let i = 0; i < ps.limit; i++) {
		const found = history.map(m => m.userId.equals(user._id) ? m.recipientId : m.userId);

		const message = await Message.findOne({
			$or: [{
				userId: user._id
			}, {
				recipientId: user._id
			}],
			$and: [{
				userId: { $nin: found },
				recipientId: { $nin: found }
			}, {
				userId: { $nin: mute.map(m => m.muteeId) },
				recipientId: { $nin: mute.map(m => m.muteeId) }
			}]
		}, {
			sort: {
				createdAt: -1
			}
		});

		if (message) {
			history.push(message);
		} else {
			break;
		}
	}

	return await Promise.all(history.map(h => pack(h._id, user)));
});
