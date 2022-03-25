import { dataSource } from '@/db/postgre.js';
import { Signin } from '@/models/entities/signin.js';

export const SigninRepository = dataSource.getRepository(Signin).extend({
	async pack(
		src: Signin,
	) {
		return src;
	},
});
