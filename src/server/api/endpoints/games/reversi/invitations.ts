import Matching, { pack as packMatching } from '../../../../../models/games/reversi/matching';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	requireCredential: true
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
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
});
