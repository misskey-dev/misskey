import rndstr from 'rndstr';
import RegistrationTicket from '../../../../models/registration-tickets';

export const meta = {
	desc: {
		'ja-JP': '招待コードを発行します。'
	},

	requireCredential: true,
	requireAdmin: true,

	params: {}
};

export default (params: any) => new Promise(async (res, rej) => {
	const code = rndstr({ length: 5, chars: '0-9' });

	await RegistrationTicket.insert({
		createdAt: new Date(),
		code: code
	});

	res({
		code: code
	});
});
