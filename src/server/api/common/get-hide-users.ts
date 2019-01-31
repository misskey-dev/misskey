import * as mongo from 'mongodb';
import Mute from '../../../models/mute';
import User, { IUser } from '../../../models/user';
import { unique } from '../../../prelude/array';

export async function getHideUserIds(me: IUser) {
	return me ? await getHideUserIdsById(me._id) : [];
}

export async function getHideUserIdsById(meId: mongo.ObjectID) {
	const suspended = (await User.find({
		isSuspended: true
	})).map(user => user._id);

	const muted = meId ? (await Mute.find({
		muterId: meId
	})).map(mute => mute.muteeId) : [];

	return unique(suspended.concat(muted));
}
