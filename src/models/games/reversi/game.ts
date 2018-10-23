import * as mongo from 'mongodb';
const deepcopy = require('deepcopy');
import db from '../../../db/mongodb';
import isObjectId from '../../../misc/is-objectid';
import { IUser, pack as packUser } from '../../user';

const ReversiGame = db.get<IReversiGame>('reversiGames');
export default ReversiGame;

export interface IReversiGame {
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
	surrendered: mongo.ObjectID;
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
 * Pack an reversi game for API response
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
	if (isObjectId(game)) {
		_game = await ReversiGame.findOne({
			_id: game
		});
	} else if (typeof game === 'string') {
		_game = await ReversiGame.findOne({
			_id: new mongo.ObjectID(game)
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
