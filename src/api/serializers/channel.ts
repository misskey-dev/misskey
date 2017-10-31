/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import { IUser } from '../models/user';
import { default as Channel, IChannel } from '../models/channel';

/**
 * Serialize a channel
 *
 * @param channel target
 * @param me? serializee
 * @return response
 */
export default (
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
	delete _channel.user_id;

	resolve(_channel);
});
