import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user';
import { id } from '../../../id';

@Entity()
export class ReversiGame {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the ReversiGame.'
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'The started date of the ReversiGame.'
	})
	public startedAt: Date | null;

	@Column(id())
	public user1Id: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user1: User | null;

	@Column(id())
	public user2Id: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user2: User | null;

	@Column('boolean', {
		default: false,
	})
	public user1Accepted: boolean;

	@Column('boolean', {
		default: false,
	})
	public user2Accepted: boolean;

	/**
	 * どちらのプレイヤーが先行(黒)か
	 * 1 ... user1
	 * 2 ... user2
	 */
	@Column('integer', {
		nullable: true,
	})
	public black: number | null;

	@Column('boolean', {
		default: false,
	})
	public isStarted: boolean;

	@Column('boolean', {
		default: false,
	})
	public isEnded: boolean;

	@Column({
		...id(),
		nullable: true
	})
	public winnerId: User['id'] | null;

	@Column({
		...id(),
		nullable: true
	})
	public surrendered: User['id'] | null;

	@Column('jsonb', {
		default: [],
	})
	public logs: {
		at: Date;
		color: boolean;
		pos: number;
	}[];

	@Column('varchar', {
		array: true, length: 64,
	})
	public map: string[];

	@Column('varchar', {
		length: 32
	})
	public bw: string;

	@Column('boolean', {
		default: false,
	})
	public isLlotheo: boolean;

	@Column('boolean', {
		default: false,
	})
	public canPutEverywhere: boolean;

	@Column('boolean', {
		default: false,
	})
	public loopedBoard: boolean;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public form1: any | null;

	@Column('jsonb', {
		nullable: true, default: null,
	})
	public form2: any | null;

	/**
	 * ログのposを文字列としてすべて連結したもののCRC32値
	 */
	@Column('varchar', {
		length: 32, nullable: true
	})
	public crc32: string | null;
}
