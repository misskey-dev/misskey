import { Entity, PrimaryColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { App } from './app';

@Entity()
export class AuthSession {
	@PrimaryColumn('char', { length: 26 })
	public id: string;

	@Column('date', {
		comment: 'The created date of the AuthSession.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 128
	})
	public token: string;

	@Column('integer', {
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column('integer')
	public appId: string;

	@ManyToOne(type => App, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public app: App | null;
}

/**
 * Pack an auth session for API response
 *
 * @param {any} session
 * @param {any} me?
 * @return {Promise<any>}
 */
export const pack = (
	session: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _session: any;

	// TODO: Populate session if it ID
	_session = deepcopy(session);

	// Me
	if (me && !isObjectId(me)) {
		if (typeof me === 'string') {
			me = new mongo.ObjectID(me);
		} else {
			me = me.id;
		}
	}

	delete _session.id;

	// Populate app
	_session.app = await packApp(_session.appId, me);

	resolve(_session);
});
