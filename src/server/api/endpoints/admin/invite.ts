import rndstr from 'rndstr';
import define from '../../define';
import { RegistrationTickets } from '../../../../models';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			code: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				example: '2ERUA5VR',
				maxLength: 8,
				minLength: 8
			}
		}
	}
};

export default define(meta, async () => {
	const code = rndstr({
		length: 8,
		chars: '2-9A-HJ-NP-Z', // [0-9A-Z] w/o [01IO] (32 patterns)
	});

	await RegistrationTickets.insert({
		id: genId(),
		createdAt: new Date(),
		code,
	});

	return {
		code,
	};
});
