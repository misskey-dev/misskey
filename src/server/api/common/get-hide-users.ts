import Mute from '../../../models/muting';
import User, { User } from '../../../models/user';
import { unique } from '../../../prelude/array';

export async function getHideUserIds(me: User) {
	return await getHideUserIdsById(me ? me.id : null);
}

export async function getHideUserIdsById(meId?: mongo.ObjectID) {
	const [suspended, muted] = await Promise.all([
		Users.find({
			isSuspended: true
		}, {
			fields: {
				id: true
			}
		}),
		meId ? Mute.find({
			muterId: meId
		}) : Promise.resolve([])
	]);

	return unique(suspended.map(user => user.id).concat(muted.map(mute => mute.muteeId)));
}
