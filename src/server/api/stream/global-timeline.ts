import * as websocket from 'websocket';
import Xev from 'xev';

import { IUser } from '../../../models/user';
import Mute from '../../../models/mute';
import shouldMuteThisNote from '../../../misc/should-mute-this-note';

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
		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, mutedUserIds)) return;

		connection.send(JSON.stringify({
			type: 'note',
			body: note
		}));
	});
}
