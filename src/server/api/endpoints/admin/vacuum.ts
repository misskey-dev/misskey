import $ from 'cafy';
import define from '../../define';
import { getConnection } from 'typeorm';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		full: {
			validator: $.bool,
		},
		analyze: {
			validator: $.bool,
		},
	}
};

export default define(meta, async (ps) => {
	const params: string[] = [];

	if (ps.full) {
		params.push('FULL');
	}

	if (ps.analyze) {
		params.push('ANALYZE');
	}

	getConnection().query('VACUUM ' + params.join(' '));
});
