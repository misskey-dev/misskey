import Meta from '../../../models/meta';
import define from '../define';

export const meta = {
	requireCredential: false,

	desc: {
		'en-US': 'Get the instance\'s statistics'
	},

	params: {
	}
};

export default define(meta, () => new Promise(async (res, rej) => {
	const meta = await Meta.findOne();

	res(meta ? meta.stats : {});
}));
