import Matching from '../../../../../../models/games/reversi/matching';
import { ILocalUser } from '../../../../../../models/user';

export const meta = {
	requireCredential: true
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	await Matching.remove({
		parentId: user._id
	});

	res();
});
