import config from '../../../config';
import { v4 as uuid } from 'uuid';

export const renderActivity = (x: any) => {
	if (x == null) return null;

	if (x !== null && typeof x === 'object' && x.id == null) {
		x.id = `${config.url}/${uuid()}`;
	}

	return Object.assign({
		'@context': [
			'https://www.w3.org/ns/activitystreams',
			'https://w3id.org/security/v1',
			{ Hashtag: 'as:Hashtag' }
		]
	}, x);
};
