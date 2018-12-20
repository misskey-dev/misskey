import Matching from '../../../../../../models/games/reversi/matching';
import define from '../../../../define';

export const meta = {
	requireCredential: true
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	await Matching.remove({
		parentId: user._id
	});

	res();
}));
