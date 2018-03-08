import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../db/mongodb';
import { IUser, pack as packUser } from './user';
import { Map } from '../../common/othello/maps';

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
		map: Map;
		bw: string | number;
		is_llotheo: boolean;
	};
}

/**
 * Pack an othello game for API response
 */
export const pack = (
	game: any,
	me?: string | mongo.ObjectID | IUser
) => new Promise<any>(async (resolve, reject) => {
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
