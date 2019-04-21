import { genMeid7 } from './id/meid7';

const method = 'meid7';

export function genId(date?: Date): string {
	if (!date || (date > new Date())) date = new Date();

	switch (method) {
		case 'meid7': return genMeid7(date);
		default: throw new Error('unknown id generation method');
	}
}
