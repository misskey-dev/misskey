import { ulid } from 'ulid';
import { genAid } from './id/aid.js';
import { genMeid } from './id/meid.js';
import { genMeidg } from './id/meidg.js';
import { genObjectId } from './id/object-id.js';
import config from '@/config/index.js';

const metohd = config.id.toLowerCase();

export function genId(date?: Date): string {
	if (!date || (date > new Date())) date = new Date();

	switch (metohd) {
		case 'aid': return genAid(date);
		case 'meid': return genMeid(date);
		case 'meidg': return genMeidg(date);
		case 'ulid': return ulid(date.getTime());
		case 'objectid': return genObjectId(date);
		default: throw new Error('unrecognized id generation method');
	}
}
