import * as deepcopy from 'deepcopy';
import { User, pack as packUser } from '../../user';

const Matching = db.get<IMatching>('reversiMatchings');
export default Matching;

export interface IMatching {
	id: mongo.ObjectID;
	createdAt: Date;
	parentId: mongo.ObjectID;
	childId: mongo.ObjectID;
}

/**
 * Pack an reversi matching for API response
 */
export const pack = (
	matching: any,
	me?: string | mongo.ObjectID | User
) => new Promise<any>(async (resolve, reject) => {

	// Me
	const meId: mongo.ObjectID = me
		? isObjectId(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as User).id
		: null;

	const _matching = deepcopy(matching);

	// Rename _id to id
	_matching.id = _matching.id;
	delete _matching.id;

	// Populate user
	_matching.parent = await packUser(_matching.parentId, meId);
	_matching.child = await packUser(_matching.childId, meId);

	resolve(_matching);
});
