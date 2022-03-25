import { db } from '@/db/postgre.js';
import { Signin } from '@/models/entities/signin.js';

export const SigninRepository = db.getRepository(Signin).extend({
	async pack(
		src: Signin,
	) {
		return src;
	},
});
