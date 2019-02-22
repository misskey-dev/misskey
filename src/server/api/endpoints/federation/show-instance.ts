import $ from 'cafy';
import define from '../../define';
import Instance from '../../../../models/instance';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	params: {
		host: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, me) => {
	const instance = await Instance
		.findOne({ host: ps.host });

	return instance;
});
