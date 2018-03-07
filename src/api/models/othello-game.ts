import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../db/mongodb';
import { IUser, pack as packUser } from './user';

const Game = db.get<IGame>('othello_games');
export default Game;

export interface IGame {
	_id: mongo.ObjectID;
	created_at: Date;
	black_user_id: mongo.ObjectID;
	white_user_id: mongo.ObjectID;
	turn_user_id: mongo.ObjectID;
	is_ended: boolean;
	winner_id: mongo.ObjectID;
	logs: any[];
}

/**
 * Pack an othello game for API response
 */
export const pack = (
	game: any,
	me?: string | mongo.ObjectID | IUser
) => new Promise<any>(async (resolve, reject) => {

	// Me
	const meId: mongo.ObjectID = me
		? mongo.ObjectID.prototype.isPrototypeOf(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as IUser)._id
		: null;

	const _game = deepcopy(game);

	// Rename _id to id
	_game.id = _game._id;
	delete _game._id;

	// Populate user
	_game.black_user = await packUser(_game.black_user_id, meId);
	_game.white_user = await packUser(_game.white_user_id, meId);
	if (_game.winner_id) {
		_game.winner = await packUser(_game.winner_id, meId);
	} else {
		_game.winner = null;
	}

	resolve(_game);
});
