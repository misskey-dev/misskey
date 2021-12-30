import define from '../../../define';
import { destroy } from '@/queue/index';
import { insertModerationLog } from '@/services/insert-moderation-log';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {},
};

export default define(meta, async (ps, me) => {
	destroy();

	insertModerationLog(me, 'clearQueue');
});
