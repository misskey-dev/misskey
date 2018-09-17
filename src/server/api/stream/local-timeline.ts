import * as websocket from 'websocket';
import Xev from 'xev';

import { IUser } from '../../../models/user';
import Mute from '../../../models/mute';
import { pack } from '../../../models/note';
import shouldMuteThisNote from '../../../misc/should-mute-this-note';

export default async function(
	request: websocket.request,
	connection: websocket.connection,
	subscriber: Xev,
	user?: IUser
) {
	const mute = user ? await Mute.find({ muterId: user._id }) : null;
	const mutedUserIds = mute ? mute.map(m => m.muteeId.toString()) : [];

	// Subscribe stream
	subscriber.on('local-timeline', async note => {
		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await pack(note.renoteId, user, {
				detail: true
			});
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, mutedUserIds)) return;

		connection.send(JSON.stringify({
			type: 'note',
			body: note
		}));
	});
}
