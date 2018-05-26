import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import db from '../db/mongodb';
import { IUser, pack as packUser } from './user';

const OthelloGame = db.get<IOthelloGame>('othelloGames');
export default OthelloGame;

export interface IOthelloGame {
	_id: mongo.ObjectID;
	createdAt: Date;
	startedAt: Date;
	user1Id: mongo.ObjectID;
	user2Id: mongo.ObjectID;
	user1Accepted: boolean;
	user2Accepted: boolean;

	/**
	 * どちらのプレイヤーが先行(黒)か
	 * 1 ... user1
	 * 2 ... user2
	 */
	black: number;

	isStarted: boolean;
	isEnded: boolean;
	winnerId: mongo.ObjectID;
	logs: Array<{
		at: Date;
		color: boolean;
		pos: number;
	}>;
	settings: {
		map: string[];
		bw: string | number;
		isLlotheo: boolean;
		canPutEverywhere: boolean;
		loopedBoard: boolean;
	};
	form1: any;
	form2: any;

	// ログのposを文字列としてすべて連結したもののCRC32値
	crc32: string;
}

/**
 * Pack an othello game for API response
 */
export const pack = (
	game: any,
	me?: string | mongo.ObjectID | IUser,
	options?: {
		detail?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: true
	}, options);

	let _game: any;

	// Populate the game if 'game' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(game)) {
		_game = await OthelloGame.findOne({
			_id: game
		});
	} else if (typeof game === 'string') {
		_game = await OthelloGame.findOne({
			_id: new mongo.ObjectID(game)
		});
	} else {
		_game = deepcopy(game);
	}

	// Me
	const meId: mongo.ObjectID = me
		? mongo.ObjectID.prototype.isPrototypeOf(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as IUser)._id
		: null;

	// Rename _id to id
	_game.id = _game._id;
	delete _game._id;

	if (opts.detail === false) {
		delete _game.logs;
		delete _game.settings.map;
	} else {
		// 互換性のため
		if (_game.settings.map.hasOwnProperty('size')) {
			_game.settings.map = _game.settings.map.data.match(new RegExp(`.{1,${_game.settings.map.size}}`, 'g'));
		}
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
