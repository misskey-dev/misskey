import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../db/mongodb';
import { IUser, pack as packUser } from './user';

const Matching = db.get<IMatching>('othelloMatchings');
export default Matching;

export interface IMatching {
	_id: mongo.ObjectID;
	createdAt: Date;
	parentId: mongo.ObjectID;
	childId: mongo.ObjectID;
}

/**
 * Pack an othello matching for API response
 */
export const pack = (
	matching: any,
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

	const _matching = deepcopy(matching);

	// Rename _id to id
	_matching.id = _matching._id;
	delete _matching._id;

	// Populate user
	_matching.parent = await packUser(_matching.parentId, meId);
	_matching.child = await packUser(_matching.childId, meId);

	resolve(_matching);
});
