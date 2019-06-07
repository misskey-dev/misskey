import config from '../../../config';
import * as uuid from 'uuid';

const hasId = <T extends object>(x: T): x is T & { id: unknown } => 'id' in x;

export const renderActivity = (x: object | null | undefined) => {
	if (!x) return null;

	if (hasId(x)) {
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
