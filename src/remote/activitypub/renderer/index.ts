import config from '../../../config';
import * as uuid from 'uuid';

export default (x: any) => {
	if (x !== null && typeof x === 'object' && x.id == null) {
		x.id = `${config.url}/${uuid.v4()}`;
	}

	return Object.assign({
		'@context': [
			'https://www.w3.org/ns/activitystreams',
			'https://w3id.org/security/v1',
			{ Hashtag: 'as:Hashtag' }
		]
	}, x);
};
