import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../db/mongodb';
import Reaction from './note-reaction';
import { pack as packUser } from './user';

const NoteReaction = db.get<INoteReaction>('noteReactions');
NoteReaction.createIndex(['userId', 'noteId'], { unique: true });
export default NoteReaction;

export interface INoteReaction {
	_id: mongo.ObjectID;
	createdAt: Date;
	noteId: mongo.ObjectID;
	userId: mongo.ObjectID;
	reaction: string;
}

/**
 * Pack a reaction for API response
 *
 * @param {any} reaction
 * @param {any} me?
 * @return {Promise<any>}
 */
export const pack = (
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
	_reaction.user = await packUser(_reaction.userId, me);

	resolve(_reaction);
});
