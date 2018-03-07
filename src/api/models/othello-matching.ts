import * as mongo from 'mongodb';
import db from '../../db/mongodb';

const Matching = db.get<IMatching>('othello_matchings');
export default Matching;

export interface IMatching {
	_id: mongo.ObjectID;
	parent_id: mongo.ObjectID;
	child_id: mongo.ObjectID;
}
