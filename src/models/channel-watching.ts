import * as mongo from 'mongodb';
import db from '../db/mongodb';

const ChannelWatching = db.get<IChannelWatching>('channelWatching');
export default ChannelWatching;

export interface IChannelWatching {
	_id: mongo.ObjectID;
	createdAt: Date;
	deletedAt: Date;
	channelId: mongo.ObjectID;
	userId: mongo.ObjectID;
}
