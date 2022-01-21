import rndstr from 'rndstr';
import define from '../../define';
import { RegistrationTickets } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			code: {
				type: 'string',
				optional: false, nullable: false,
				example: '2ERUA5VR',
				maxLength: 8,
				minLength: 8,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
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
