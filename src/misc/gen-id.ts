import { ulid } from 'ulid';
import { genAid } from './id/aid';
import { genObjectId } from './id/object-id';
import config from '../config';

const metohd = config.id.toLowerCase();

export function genId(date?: Date): string {
	if (!date || (date > new Date())) date = new Date();

	switch (metohd) {
		case 'aid': return genAid(date);
		case 'ulid': return ulid(date.getTime());
		case 'objectid': return genObjectId(date);
		default: throw 'unknown id generation method';
	}
}
