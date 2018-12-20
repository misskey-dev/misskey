import Matching, { pack as packMatching } from '../../../../../models/games/reversi/matching';
import define from '../../../define';

export const meta = {
	requireCredential: true
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Find session
	const invitations = await Matching.find({
		childId: user._id
	}, {
		sort: {
			_id: -1
		}
	});

	// Reponse
	res(Promise.all(invitations.map(async (i) => await packMatching(i, user))));
}));
