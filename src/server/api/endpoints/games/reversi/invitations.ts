import Matching, { pack as packMatching } from '../../../../../models/games/reversi/matching';
import define from '../../../define';

export const meta = {
	tags: ['games'],

	requireCredential: true
};

export default define(meta, async (ps, user) => {
	// Find session
	const invitations = await Matching.find({
		childId: user._id
	}, {
		sort: {
			_id: -1
		}
	});

	return await Promise.all(invitations.map((i) => packMatching(i, user)));
});
