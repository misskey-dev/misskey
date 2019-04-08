import rndstr from 'rndstr';
import define from '../../define';
import { RegistrationTickets } from '../../../../models';
import { genId } from '../../../../misc/gen-id';

export const meta = {
	desc: {
		'ja-JP': '招待コードを発行します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {}
};

export default define(meta, async (ps) => {
	const code = rndstr({ length: 5, chars: '0-9' });

	await RegistrationTickets.save({
		id: genId(),
		createdAt: new Date(),
		code: code
	});

	return {
		code: code
	};
});
