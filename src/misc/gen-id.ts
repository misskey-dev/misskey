import { ulid } from 'ulid';
import { genAid } from './id/aid';
import { genMeid } from './id/meid';
import { genMeidg } from './id/meidg';
import { genObjectId } from './id/object-id';
import config from '../config';

const method = config.id.toLowerCase();

export function genId(date?: Date): string {
	if (!date || (date > new Date())) date = new Date();

	switch (method) {
		case 'aid': return genAid(date);
		case 'meid': return genMeid(date);
		case 'meidg': return genMeidg(date);
		case 'ulid': return ulid(date.getTime());
		case 'objectid': return genObjectId(date);
		default: throw new Error('unknown id generation method');
	}
}
