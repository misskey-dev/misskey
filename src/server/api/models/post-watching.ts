import * as mongo from 'mongodb';
import db from '../../../db/mongodb';

const PostWatching = db.get<IPostWatching>('postWatching');
export default PostWatching;

export interface IPostWatching {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	postId: mongo.ObjectID;
}
