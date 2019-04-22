import { EntityRepository, Repository } from 'typeorm';
import { Apps } from '..';
import { AuthSession } from '../entities/auth-session';
import { ensure } from '../../prelude/ensure';

@EntityRepository(AuthSession)
export class AuthSessionRepository extends Repository<AuthSession> {
	public async pack(
		src: AuthSession['id'] | AuthSession,
		me?: any
	) {
		const session = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await rap({
			id: session.id,
			app: Apps.pack(session.appId, me),
			token: session.token
		});
	}
}
