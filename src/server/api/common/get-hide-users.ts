import * as mongo from 'mongodb';
import Mute from '../../../models/mute';
import User, { IUser } from '../../../models/user';
import { unique } from '../../../prelude/array';

export async function getHideUserIds(me: IUser) {
	return await getHideUserIdsById(me ? me._id : null);
}

export async function getHideUserIdsById(meId?: mongo.ObjectID) {
	const [suspended, muted] = await Promise.all([
		User.find({
			isSuspended: true
		}, {
			fields: {
				_id: true
			}
		}),
		meId ? Mute.find({
			muterId: meId
		}) : Promise.resolve([])
	]);

	return unique(suspended.map(user => user._id).concat(muted.map(mute => mute.muteeId)));
}
