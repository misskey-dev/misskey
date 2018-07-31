import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Hashtag = db.get<IHashtags>('hashtags');
Hashtag.createIndex('tag', { unique: true });
Hashtag.createIndex('mentionedUserIdsCount');
export default Hashtag;

export interface IHashtags {
	tag: string;
	mentionedUserIds: mongo.ObjectID[];
	mentionedUserIdsCount: number;
}
