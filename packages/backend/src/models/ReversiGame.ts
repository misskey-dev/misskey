import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('reversi_game')
export class MiReversiGame {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		nullable: true,
		comment: 'The started date of the ReversiGame.',
	})
	public startedAt: Date | null;

	@Column(id())
	public user1Id: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user1: MiUser | null;

	@Column(id())
	public user2Id: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user2: MiUser | null;

	@Column('boolean', {
		default: false,
	})
	public user1Ready: boolean;

	@Column('boolean', {
		default: false,
	})
	public user2Ready: boolean;

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
		nullable: true,
	})
	public winnerId: MiUser['id'] | null;

	@Column({
		...id(),
		nullable: true,
	})
	public surrendered: MiUser['id'] | null;

	@Column('jsonb', {
		default: [],
	})
	public logs: {
		at: number;
		color: boolean;
		pos: number;
	}[];

	@Column('varchar', {
		array: true, length: 64,
	})
	public map: string[];

	@Column('varchar', {
		length: 32,
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
		length: 32, nullable: true,
	})
	public crc32: string | null;
}
