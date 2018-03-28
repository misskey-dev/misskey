import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import { IUser } from './user';
import Watching from './channel-watching';
import db from '../../db/mongodb';

const Channel = db.get<IChannel>('channels');
export default Channel;

export type IChannel = {
	_id: mongo.ObjectID;
	createdAt: Date;
	title: string;
	userId: mongo.ObjectID;
	index: number;
	watchingCount: number;
};

/**
 * Pack a channel for API response
 *
 * @param channel target
 * @param me? serializee
 * @return response
 */
export const pack = (
	channel: string | mongo.ObjectID | IChannel,
	me?: string | mongo.ObjectID | IUser
) => new Promise<any>(async (resolve, reject) => {

	let _channel: any;

	// Populate the channel if 'channel' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(channel)) {
		_channel = await Channel.findOne({
			_id: channel
		});
	} else if (typeof channel === 'string') {
		_channel = await Channel.findOne({
			_id: new mongo.ObjectID(channel)
		});
	} else {
		_channel = deepcopy(channel);
	}

	// Rename _id to id
	_channel.id = _channel._id;
	delete _channel._id;

	// Remove needless properties
	delete _channel.userId;

	// Me
	const meId: mongo.ObjectID = me
	? mongo.ObjectID.prototype.isPrototypeOf(me)
		? me as mongo.ObjectID
		: typeof me === 'string'
			? new mongo.ObjectID(me)
			: (me as IUser)._id
	: null;

	if (me) {
		//#region Watchしているかどうか
		const watch = await Watching.findOne({
			userId: meId,
			channel_id: _channel.id,
			deletedAt: { $exists: false }
		});

		_channel.is_watching = watch !== null;
		//#endregion
	}

	resolve(_channel);
});
