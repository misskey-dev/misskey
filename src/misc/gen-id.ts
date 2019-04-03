import { ulid } from 'ulid';
import { genAid } from './aid';
import { genAidc } from './aidc';
import { genObjectId } from './object-id';
import config from '../config';

const metohd = config.id.toLowerCase();

export function genId(date?: Date): string {
	if (!date || (date > new Date())) date = new Date();

	switch (metohd) {
		case 'aidc': return genAidc(date);
		case 'aid1': return genAid(date, 1);
		case 'aid2': return genAid(date, 2);
		case 'aid3': return genAid(date, 3);
		case 'aid4': return genAid(date, 4);
		case 'ulid': return ulid(date.getTime());
		case 'objectid': return genObjectId(date);
		default: throw 'unknown id generation method';
	}
}
