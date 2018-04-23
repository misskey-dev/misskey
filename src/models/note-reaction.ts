import * as mongo from 'mongodb';
import $ from 'cafy';
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

export const validateReaction = $().string().or([
	'like',
	'love',
	'laugh',
	'hmm',
	'surprise',
	'congrats',
	'angry',
	'confused',
	'pudding'
]);

/**
 * NoteReactionを物理削除します
 */
export async function deleteNoteReaction(noteReaction: string | mongo.ObjectID | INoteReaction) {
	let n: INoteReaction;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(noteReaction)) {
		n = await NoteReaction.findOne({
			_id: noteReaction
		});
	} else if (typeof noteReaction === 'string') {
		n = await NoteReaction.findOne({
			_id: new mongo.ObjectID(noteReaction)
		});
	} else {
		n = noteReaction as INoteReaction;
	}

	if (n == null) return;

	// このNoteReactionを削除
	await NoteReaction.remove({
		_id: n._id
	});
}

/**
 * Pack a reaction for API response
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
