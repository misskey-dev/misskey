import * as websocket from 'websocket';
import Xev from 'xev';

import { IUser } from '../../../models/user';
import Mute from '../../../models/mute';

export default async function(
	request: websocket.request,
	connection: websocket.connection,
	subscriber: Xev,
	user: IUser
) {
	const mute = await Mute.find({ muterId: user._id });
	const mutedUserIds = mute.map(m => m.muteeId.toString());

	// Subscribe stream
	subscriber.on('global-timeline', async note => {
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
