import * as mongo from 'mongodb';

import db from '../../db/mongodb';

export default db.get('posts') as any; // fuck type definition

export function isValidText(text: string): boolean {
	return text.length <= 1000 && text.trim() != '';
}

export type IPost = {
	_id: mongo.ObjectID;
	channel_id: mongo.ObjectID;
	created_at: Date;
	media_ids: mongo.ObjectID[];
	reply_id: mongo.ObjectID;
	repost_id: mongo.ObjectID;
	poll: {}; // todo
	text: string;
	user_id: mongo.ObjectID;
	app_id: mongo.ObjectID;
};
