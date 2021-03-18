import define from '../../../define';
import { destroy } from '../../../../../queue';
import { insertModerationLog } from '../../../../../services/insert-moderation-log';

export const meta = {
	desc: {
		'ja-JP': 'ジョブキューを全て削除します。',
		'en-US': 'Delete all job queues.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps, me) => {
	destroy();

	insertModerationLog(me, 'clearQueue');
});
