import * as websocket from 'websocket';
import Xev from 'xev';
import * as debug from 'debug';

import User, { IUser } from '../../../models/user';
import Mute from '../../../models/mute';
import { pack as packNote, pack } from '../../../models/note';
import readNotification from '../common/read-notification';
import call from '../call';
import { IApp } from '../../../models/app';
import shouldMuteThisNote from '../../../misc/should-mute-this-note';

const log = debug('misskey');

export default async function(
	request: websocket.request,
	connection: websocket.connection,
	subscriber: Xev,
	user: IUser,
	app: IApp
) {
	const mute = await Mute.find({ muterId: user._id });
	const mutedUserIds = mute.map(m => m.muteeId.toString());

	async function onNoteStream(noteId: any) {
		const note = await packNote(noteId, user, {
			detail: true
		});

		connection.send(JSON.stringify({
			type: 'note-updated',
			body: {
				note: note
			}
		}));
	}

	// Subscribe Home stream channel
	subscriber.on(`user-stream:${user._id}`, async x => {
		// Renoteなら再pack
		if (x.type == 'note' && x.body.renoteId != null) {
			x.body.renote = await pack(x.body.renoteId, user, {
				detail: true
			});
		}

		//#region 流れてきたメッセージがミュートしているユーザーが関わるものだったら無視する
		if (x.type == 'note') {
			if (shouldMuteThisNote(x.body, mutedUserIds)) return;
		} else if (x.type == 'notification') {
			if (mutedUserIds.includes(x.body.userId)) {
				return;
			}
		}
		//#endregion

		connection.send(JSON.stringify(x));
	});

	connection.on('message', async data => {
		const msg = JSON.parse(data.utf8Data);

		switch (msg.type) {
			case 'api':
				// 新鮮なデータを利用するためにユーザーをフェッチ
				call(msg.endpoint, await User.findOne({ _id: user._id }), app, msg.data).then(res => {
					connection.send(JSON.stringify({
						type: `api-res:${msg.id}`,
						body: { res }
					}));
				}).catch(e => {
					connection.send(JSON.stringify({
						type: `api-res:${msg.id}`,
						body: { e }
					}));
				});
				break;

			case 'alive':
				// Update lastUsedAt
				User.update({ _id: user._id }, {
					$set: {
						'lastUsedAt': new Date()
					}
				});
				break;

			case 'read_notification':
				if (!msg.id) return;
				readNotification(user._id, msg.id);
				break;

			case 'capture':
				if (!msg.id) return;
				log(`CAPTURE: ${msg.id} by @${user.username}`);
				subscriber.on(`note-stream:${msg.id}`, onNoteStream);
				break;

			case 'decapture':
				if (!msg.id) return;
				log(`DECAPTURE: ${msg.id} by @${user.username}`);
				subscriber.off(`note-stream:${msg.id}`, onNoteStream);
				break;
		}
	});
}
