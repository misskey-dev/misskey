import Meta from '../../../models/meta';

/**
 * Get the misskey's statistics
 */
module.exports = () => new Promise(async (res, rej) => {
	const meta = await Meta.findOne();

	res(meta.stats);
});
