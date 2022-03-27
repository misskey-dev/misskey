import { db } from '@/db/postgre.js';
import { Apps } from '../index.js';
import { AuthSession } from '@/models/entities/auth-session.js';
import { awaitAll } from '@/prelude/await-all.js';
import { User } from '@/models/entities/user.js';

export const AuthSessionRepository = db.getRepository(AuthSession).extend({
	async pack(
		src: AuthSession['id'] | AuthSession,
		me?: { id: User['id'] } | null | undefined
	) {
		const session = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return await awaitAll({
			id: session.id,
			app: Apps.pack(session.appId, me),
			token: session.token,
		});
	},
});
