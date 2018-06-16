import Matching from '../../../../../models/reversi-matching';

module.exports = (params, user) => new Promise(async (res, rej) => {
	await Matching.remove({
		parentId: user._id
	});

	res();
});
