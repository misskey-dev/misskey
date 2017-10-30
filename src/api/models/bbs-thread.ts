import * as mongo from 'mongodb';
import db from '../../db/mongodb';

const collection = db.get('bbs_threads');

export default collection as any; // fuck type definition

export type IBbsThread = {
	_id: mongo.ObjectID;
	created_at: Date;
	title: string;
	user_id: mongo.ObjectID;
};
