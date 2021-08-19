import define from '../../../define.js';
import { destroy } from '@/queue/index.js';
import { insertModerationLog } from '@/services/insert-moderation-log.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps, me) => {
	destroy();

	insertModerationLog(me, 'clearQueue');
});
