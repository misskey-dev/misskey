import Meta from '../../../models/meta';

/**
 * Get the misskey's statistics
 */
export default () => new Promise(async (res, rej) => {
	const meta = await Meta.findOne();

	res(meta ? meta.stats : {});
});
