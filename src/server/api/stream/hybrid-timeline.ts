import * as websocket from 'websocket';
import * as redis from 'redis';

import { IUser } from '../../../models/user';
import Mute from '../../../models/mute';
import { pack } from '../../../models/note';

export default async function(
	request: websocket.request,
	connection: websocket.connection,
	subscriber: redis.RedisClient,
	user: IUser
) {
	// Subscribe stream
	subscriber.subscribe(`misskey:hybrid-timeline:${user._id}`);

	const mute = await Mute.find({ muterId: user._id });
	const mutedUserIds = mute.map(m => m.muteeId.toString());

	subscriber.on('message', async (_, data) => {
		const note = JSON.parse(data);

		//#region 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (mutedUserIds.indexOf(note.userId) != -1) {
			return;
		}
		if (note.reply != null && mutedUserIds.indexOf(note.reply.userId) != -1) {
			return;
		}
		if (note.renote != null && mutedUserIds.indexOf(note.renote.userId) != -1) {
			return;
		}
		//#endregion

		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await pack(note.renoteId, user, {
				detail: true
			});
		}

		connection.send(JSON.stringify({
			type: 'note',
			body: note
		}));
	});
}
