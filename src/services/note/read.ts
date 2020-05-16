import { publishMainStream } from '../stream';
import { Note } from '../../models/entities/note';
import { User } from '../../models/entities/user';
import { NoteUnreads, Antennas, AntennaNotes, Users } from '../../models';

// TODO: 状態が変化していない場合は各種イベントを送信しない

/**
 * Mark a note as read
 */
export default (
	userId: User['id'],
	noteId: Note['id']
) => new Promise<any>(async (resolve, reject) => {
	// Remove document
	/*const res = */await NoteUnreads.delete({
		userId: userId,
		noteId: noteId
	});

	// v11 TODO: https://github.com/typeorm/typeorm/issues/2415
	//if (res.affected === 0) {
	//	return;
	//}

	const [count1, count2] = await Promise.all([
		NoteUnreads.count({
			userId: userId,
			isSpecified: false
		}),
		NoteUnreads.count({
			userId: userId,
			isSpecified: true
		})
	]);

	if (count1 === 0) {
		// 全て既読になったイベントを発行
		publishMainStream(userId, 'readAllUnreadMentions');
	}

	if (count2 === 0) {
		// 全て既読になったイベントを発行
		publishMainStream(userId, 'readAllUnreadSpecifiedNotes');
	}

	const antennas = await Antennas.find({ userId });

	await Promise.all(antennas.map(async antenna => {
		await AntennaNotes.update({
			antennaId: antenna.id,
			noteId: noteId
		}, {
			read: true
		});

		const count = await AntennaNotes.count({
			antennaId: antenna.id,
			read: false
		});

		if (count === 0) {
			publishMainStream(userId, 'readAntenna', antenna);
		}
	}));

	Users.getHasUnreadAntenna(userId).then(unread => {
		if (!unread) {
			publishMainStream(userId, 'readAllAntennas');
		}
	});
});
