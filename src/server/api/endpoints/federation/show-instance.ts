import $ from 'cafy';
import define from '../../define';
import Instance from '../../../../models/instance';

export const meta = {
	requireCredential: false,

	params: {
		host: {
			validator: $.str
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const instance = await Instance
		.findOne({ host: ps.host });

	res(instance);
}));
