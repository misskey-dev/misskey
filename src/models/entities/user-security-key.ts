import { PrimaryColumn, Entity, JoinColumn, Column, OneToOne } from 'typeorm';
import { UserProfile } from './user-profile';
import { id } from '../id';

@Entity()
export class UserSecurityKey {
	@PrimaryColumn('varchar', {
		comment: 'Variable-length id given to navigator.credentials.get()'
	})
	public credentialId: string;

	@Column(id())
	public userId: UserProfile['userId'];

	@OneToOne(type => UserProfile, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public userProfile: UserProfile | null;

	@Column('varchar', {
		comment:
			'Variable-length public key used to verify attestations (hex-encoded).'
	})
	public publicKey: string;

	@Column('timestamp with time zone', {
		comment:
			'The date of the last time the UserSecurityKey was successfully validated.'
	})
	public lastUsed: Date;

	@Column('varchar', {
		comment: 'User-defined name for this key',
		length: 30
	})
	public name: string;

	constructor(data: Partial<UserSecurityKey>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
