import Matching from '../../../../../../models/games/reversi/matching';
import define from '../../../../define';

export const meta = {
	requireCredential: true
};

export default define(meta, (_, user) => Matching.remove({ parentId: user._id })
	.then(() => {}));
