import define from '../../../define';
import { destroy } from '@/queue/index';
import { insertModerationLog } from '@/services/insert-moderation-log';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	destroy();

	insertModerationLog(me, 'clearQueue');
});
