import { EntityRepository, Repository } from 'typeorm';
import { Apps } from '../index';
import { AuthSession } from '@/models/entities/auth-session';
import { awaitAll } from '@/prelude/await-all';
import { User } from '@/models/entities/user';

@EntityRepository(AuthSession)
export class AuthSessionRepository extends Repository<AuthSession> {
	public async pack(
		src: AuthSession['id'] | AuthSession,
		me?: { id: User['id'] } | null | undefined
	) {
		const session = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return await awaitAll({
			id: session.id,
			app: Apps.pack(session.appId, me),
			token: session.token
		});
	}
}
