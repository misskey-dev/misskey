import define from '../../../define';
import { destroy } from '@/queue/index';
import { insertModerationLog } from '@/services/insert-moderation-log';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

const paramDef = {

} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	destroy();

	insertModerationLog(me, 'clearQueue');
});
