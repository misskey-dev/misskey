import * as websocket from 'websocket';
import * as redis from 'redis';

import { IUser } from '../../../models/user';
import Mute from '../../../models/mute';

export default async function(
	request: websocket.request,
	connection: websocket.connection,
	subscriber: redis.RedisClient,
	user: IUser
) {
	// Subscribe stream
	subscriber.subscribe(`misskey:global-timeline`);

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

		connection.send(JSON.stringify({
			type: 'note',
			body: note
		}));
	});
}
