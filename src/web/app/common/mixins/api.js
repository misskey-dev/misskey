import * as riot from 'riot';
import api from '../scripts/api';

export default me => {
	riot.mixin('api', {
		api: api.bind(null, me ? me.token : null)
	});
};
