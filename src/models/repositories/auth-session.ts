import { EntityRepository, Repository } from 'typeorm';
import { Apps } from '..';
import rap from '@prezzemolo/rap';
import { AuthSession } from '../entities/auth-session';

@EntityRepository(AuthSession)
export class AuthSessionRepository extends Repository<AuthSession> {
	public async pack(
		src: AuthSession['id'] | AuthSession,
		me?: any
	) {
		const session = typeof src === 'object' ? src : await this.findOne(src);

		return await rap({
			id: session.id,
			app: Apps.pack(session.appId, me)
		});
	}
}
