import $ from 'cafy';
import define from '../../define';
import { Instances } from '../../../../models';

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
	const instance = await Instances
		.findOne({ host: ps.host });

	return instance;
});
