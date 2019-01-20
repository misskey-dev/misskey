import $ from 'cafy';
import Mute from '../../../../models/mute';
import Message, { pack, IMessagingMessage } from '../../../../models/messaging-message';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'Messagingの履歴を取得します。',
		'en-US': 'Show messaging history.'
	},

	requireCredential: true,

	kind: 'messaging-read',

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		}
	}
};

export default define(meta, (ps, user) => Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false },
	})
	.then(x => Array(ps.limit).reduce((a, _) => a.then((b: IMessagingMessage[]) => {
		const $nin = b.map(m => m.userId.equals(user._id) ? m.recipientId : m.userId);
		return Message.findOne({
			$or: [
				{ userId: user._id },
				{ recipientId: user._id }
			],
			$and: [{
				userId: { $nin },
				recipientId: { $nin }
			}, {
				userId: { $nin: x.map(m => m.muteeId) },
				recipientId: { $nin: x.map(m => m.muteeId) }
			}]
		}, {
			sort: { createdAt: -1 }
		})
		.then(c => [...b, c]);
	}), Promise.resolve([] as IMessagingMessage[]))
	.then((x: IMessagingMessage[]) => x.filter(x => x).map(x => pack(x._id, user)))));
