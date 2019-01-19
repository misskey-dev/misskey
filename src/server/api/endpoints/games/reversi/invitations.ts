import Matching, { pack as packMatching } from '../../../../../models/games/reversi/matching';
import define from '../../../define';

export const meta = {
	requireCredential: true
};

export default define(meta, (_, user) => Matching.find({ childId: user._id }, {
		sort: { id: -1 }
	})
	.then(x => Promise.all(x.map(x => packMatching(x, user)))));
