import { PrimaryColumn, Entity, Index, JoinColumn, Column, OneToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
export class UserServiceLinking {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column(id())
	public userId: User['id'];

	@OneToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column('boolean', {
		default: false,
	})
	public twitter: boolean;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public twitterAccessToken: string | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public twitterAccessTokenSecret: string | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public twitterUserId: string | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public twitterScreenName: string | null;

	@Column('boolean', {
		default: false,
	})
	public github: boolean;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public githubAccessToken: string | null;

	@Column('integer', {
		nullable: true, default: null,
	})
	public githubId: number | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public githubLogin: string | null;

	@Column('boolean', {
		default: false,
	})
	public discord: boolean;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public discordAccessToken: string | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public discordRefreshToken: string | null;

	@Column('integer', {
		nullable: true, default: null,
	})
	public discordExpiresDate: number | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public discordId: string | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public discordUsername: string | null;

	@Column('varchar', {
		length: 64, nullable: true, default: null,
	})
	public discordDiscriminator: string | null;

	//#region Denormalized fields
	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: '[Denormalized]'
	})
	public userHost: string | null;
	//#endregion
}
