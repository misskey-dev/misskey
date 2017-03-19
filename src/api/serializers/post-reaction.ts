/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import Reaction from '../models/post-reaction';
import serializeUser from './user';

/**
 * Serialize a reaction
 *
 * @param {any} reaction
 * @param {any} me?
 * @return {Promise<any>}
 */
export default (
	reaction: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _reaction: any;

	// Populate the reaction if 'reaction' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(reaction)) {
		_reaction = await Reaction.findOne({
			_id: reaction
		});
	} else if (typeof reaction === 'string') {
		_reaction = await Reaction.findOne({
			_id: new mongo.ObjectID(reaction)
		});
	} else {
		_reaction = deepcopy(reaction);
	}

	// Rename _id to id
	_reaction.id = _reaction._id;
	delete _reaction._id;

	// Populate user
	_reaction.user = await serializeUser(_reaction.user_id, me);

	resolve(_reaction);
});
