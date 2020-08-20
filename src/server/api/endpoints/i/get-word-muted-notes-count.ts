import define from '../../define';
import { MutedNotes } from '../../../../models';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	kind: 'read:account',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	return {
		count: await MutedNotes.count({
			userId: user.id,
			reason: 'word'
		})
	};
});
