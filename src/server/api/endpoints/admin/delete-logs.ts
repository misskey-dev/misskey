import define from '../../define';
import { Logs } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ログを全て削除します。',
		'en-US': 'Delete all logs.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,
};

export default define(meta, async (ps) => {
	await Logs.clear();	// TRUNCATE
});
