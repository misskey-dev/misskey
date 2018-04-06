import * as mongo from 'mongodb';
import db from '../db/mongodb';

const PostWatching = db.get<IPostWatching>('postWatching');
PostWatching.createIndex(['userId', 'postId'], { unique: true });
export default PostWatching;

export interface IPostWatching {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	postId: mongo.ObjectID;
}
