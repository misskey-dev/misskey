import define from '../../../define';
import { destroy } from '../../../../../queue';
import { insertModerationLog } from '../../../../../services/insert-moderation-log';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps, me) => {
	destroy();

	insertModerationLog(me, 'clearQueue');
});
