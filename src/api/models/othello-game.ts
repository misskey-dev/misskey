import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../db/mongodb';
import { IUser, pack as packUser } from './user';

const Game = db.get<IGame>('othello_games');
export default Game;

export interface IGame {
	_id: mongo.ObjectID;
	created_at: Date;
	started_at: Date;
	user1_id: mongo.ObjectID;
	user2_id: mongo.ObjectID;
	user1_accepted: boolean;
	user2_accepted: boolean;

	/**
	 * どちらのプレイヤーが先行(黒)か
	 * 1 ... user1
	 * 2 ... user2
	 */
	black: number;

	is_started: boolean;
	is_ended: boolean;
	winner_id: mongo.ObjectID;
	logs: any[];
	settings: {
		map: string[];
		bw: string | number;
		is_llotheo: boolean;
		can_put_everywhere: boolean;
	};
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
		_game = await Game.findOne({
			_id: game
		});
	} else if (typeof game === 'string') {
		_game = await Game.findOne({
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
	_game.user1 = await packUser(_game.user1_id, meId);
	_game.user2 = await packUser(_game.user2_id, meId);
	if (_game.winner_id) {
		_game.winner = await packUser(_game.winner_id, meId);
	} else {
		_game.winner = null;
	}

	resolve(_game);
});
