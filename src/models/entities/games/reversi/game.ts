import * as deepcopy from 'deepcopy';
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
		comment: 'The started date of the ReversiGame.'
	})
	public startedAt: Date;

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
	@Column('integer')
	public black: number;

	@Column('boolean', {
		default: false,
	})
	public isStarted: boolean;

	@Column('boolean', {
		default: false,
	})
	public isEnded: boolean;

	@Column('char', {
		length: 26, nullable: true
	})
	public winnerId: User['id'] | null;

	@Column('char', {
		length: 26, nullable: true
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
		default: {},
	})
	public form1: any;

	@Column('jsonb', {
		default: {},
	})
	public form2: any;

	/**
	 * ログのposを文字列としてすべて連結したもののCRC32値
	 */
	@Column('varchar', {
		length: 32
	})
	public crc32: string;
}

/**
 * Pack an reversi game for API response
 */
export const pack = (
	game: any,
	me?: string | mongo.ObjectID | User,
	options?: {
		detail?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: true
	}, options);

	let _game: any;

	// Populate the game if 'game' is ID
	if (isObjectId(game)) {
		_game = await ReversiGame.findOne({
			id: game
		});
	} else if (typeof game === 'string') {
		_game = await ReversiGame.findOne({
			id: new mongo.ObjectID(game)
		});
	} else {
		_game = deepcopy(game);
	}

	// Me
	const meId: mongo.ObjectID = me
		? isObjectId(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as User).id
		: null;

	// Rename _id to id
	_game.id = _game.id;
	delete _game.id;

	if (opts.detail === false) {
		delete _game.logs;
		delete _game.settings.map;
	}

	// Populate user
	_game.user1 = await packUser(_game.user1Id, meId);
	_game.user2 = await packUser(_game.user2Id, meId);
	if (_game.winnerId) {
		_game.winner = await packUser(_game.winnerId, meId);
	} else {
		_game.winner = null;
	}

	resolve(_game);
});
