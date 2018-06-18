import Matching from '../../../../../models/reversi-matching';
import { ILocalUser } from '../../../../../models/user';

module.exports = (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	await Matching.remove({
		parentId: user._id
	});

	res();
});
