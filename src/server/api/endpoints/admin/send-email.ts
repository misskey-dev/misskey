import $ from 'cafy';
import define from '../../define.js';
import { sendEmail } from '@/services/send-email.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		to: {
			validator: $.str,
		},
		subject: {
			validator: $.str,
		},
		text: {
			validator: $.str,
		},
	}
};

export default define(meta, async (ps) => {
	await sendEmail(ps.to, ps.subject, ps.text, ps.text);
});
