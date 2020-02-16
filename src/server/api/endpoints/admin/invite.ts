import rndstr from 'rndstr';
import define from '../../define';
import { RegistrationTickets } from '../../../../models';
import { genId } from '../../../../misc/gen-id';

export const meta = {
	desc: {
		'ja-JP': '招待コードを発行します。'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {}
};

export default define(meta, async () => {
	const code = rndstr({
		length: 8,
		chars: '2-9A-HJ-NP-Z', // [0-9A-Z] w/o [01IO] (32 patterns)
	});

	await RegistrationTickets.save({
		id: genId(),
		createdAt: new Date(),
		code,
	});

	return {
		code,
	};
});
