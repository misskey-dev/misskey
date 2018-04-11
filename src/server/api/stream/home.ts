import * as websocket from 'websocket';
import * as redis from 'redis';
import * as debug from 'debug';

import User, { IUser } from '../../../models/user';
import Mute from '../../../models/mute';
import { pack as packNote } from '../../../models/note';
import readNotification from '../common/read-notification';
import call from '../call';
import { IApp } from '../../../models/app';

const log = debug('misskey');

export default async function(
	request: websocket.request,
	connection: websocket.connection,
	subscriber: redis.RedisClient,
	user: IUser,
	app: IApp
) {
	// Subscribe Home stream channel
	subscriber.subscribe(`misskey:user-stream:${user._id}`);

	const mute = await Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false }
	});
	const mutedUserIds = mute.map(m => m.muteeId.toString());

	subscriber.on('message', async (channel, data) => {
		switch (channel.split(':')[1]) {
			case 'user-stream':
				try {
					const x = JSON.parse(data);

					if (x.type == 'note') {
						if (mutedUserIds.indexOf(x.body.userId) != -1) {
							return;
						}
						if (x.body.reply != null && mutedUserIds.indexOf(x.body.reply.userId) != -1) {
							return;
						}
						if (x.body.renote != null && mutedUserIds.indexOf(x.body.renote.userId) != -1) {
							return;
						}
					} else if (x.type == 'notification') {
						if (mutedUserIds.indexOf(x.body.userId) != -1) {
							return;
						}
					}

					connection.send(data);
				} catch (e) {
					connection.send(data);
				}
				break;
			case 'note-stream':
				const noteId = channel.split(':')[2];
				log(`RECEIVED: ${noteId} ${data} by @${user.username}`);
				const note = await packNote(noteId, user, {
					detail: true
				});
				connection.send(JSON.stringify({
					type: 'note-updated',
					body: {
						note: note
					}
				}));
				break;
		}
	});

	connection.on('message', data => {
		const msg = JSON.parse(data.utf8Data);

		switch (msg.type) {
			case 'api':
				call(msg.endpoint, user, app, msg.data).then(res => {
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
				const noteId = msg.id;
				log(`CAPTURE: ${noteId} by @${user.username}`);
				subscriber.subscribe(`misskey:note-stream:${noteId}`);
				break;
		}
	});
}
