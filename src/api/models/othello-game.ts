import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../db/mongodb';

const Game = db.get<IGame>('othello_games');
export default Game;

export interface IGame {
	_id: mongo.ObjectID;
	created_at: Date;
	black_user_id: mongo.ObjectID;
	white_user_id: mongo.ObjectID;
	logs: any[];
}

/**
 * Pack an othello game for API response
 *
 * @param {any} game
 * @return {Promise<any>}
 */
export const pack = (
	game: any
) => new Promise<any>(async (resolve, reject) => {

	const _game = deepcopy(game);

	// Rename _id to id
	_game.id = _game._id;
	delete _game._id;

	resolve(_game);
});
