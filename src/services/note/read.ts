import { publishMainStream } from '../stream';
import { Note } from '../../models/entities/note';
import { User } from '../../models/entities/user';
import { NoteUnreads, AntennaNotes, Users } from '../../models';
import { Not, IsNull, In } from 'typeorm';
import { Channel } from '../../models/entities/channel';
import { checkHitAntenna } from '../../misc/check-hit-antenna';
import { getAntennas } from '../../misc/antenna-cache';
import { PackedNote } from '../../models/repositories/note';

/**
 * Mark notes as read
 */
export default async function(
	userId: User['id'],
	notes: (Note | PackedNote)[],
	info: {
		following: Set<Channel['id']>;
		followingChannels: Set<Channel['id']>;
	}
) {
	const myAntennas = (await getAntennas()).filter(a => a.userId === userId);
	const readMentions: (Note | PackedNote)[] = [];
	const readSpecifiedNotes: (Note | PackedNote)[] = [];
	const readChannelNotes: (Note | PackedNote)[] = [];
	const readAntennaNotes: (Note | PackedNote)[] = [];

	for (const note of notes) {
		if (note.mentions && note.mentions.includes(userId)) {
			readMentions.push(note);
		} else if (note.visibleUserIds && note.visibleUserIds.includes(userId)) {
			readSpecifiedNotes.push(note);
		}

		if (note.channelId && info.followingChannels.has(note.channelId)) {
			readChannelNotes.push(note);
		}

		if (note.user != null) { // たぶんnullになることは無いはずだけど一応
			for (const antenna of myAntennas) {
				if (checkHitAntenna(antenna, note, note.user as any, undefined, Array.from(info.following))) {
					readAntennaNotes.push(note);
				}
			}
		}
	}

	if ((readMentions.length > 0) || (readSpecifiedNotes.length > 0) || (readChannelNotes.length > 0)) {
		// Remove the record
		await NoteUnreads.delete({
			userId: userId,
			noteId: In([...readMentions.map(n => n.id), ...readSpecifiedNotes.map(n => n.id), ...readChannelNotes.map(n => n.id)]),
		});

		// TODO: ↓まとめてクエリしたい

		NoteUnreads.count({
			userId: userId,
			isMentioned: true
		}).then(mentionsCount => {
			if (mentionsCount === 0) {
				// 全て既読になったイベントを発行
				publishMainStream(userId, 'readAllUnreadMentions');
			}
		});

		NoteUnreads.count({
			userId: userId,
			isSpecified: true
		}).then(specifiedCount => {
			if (specifiedCount === 0) {
				// 全て既読になったイベントを発行
				publishMainStream(userId, 'readAllUnreadSpecifiedNotes');
			}
		});

		NoteUnreads.count({
			userId: userId,
			noteChannelId: Not(IsNull())
		}).then(channelNoteCount => {
			if (channelNoteCount === 0) {
				// 全て既読になったイベントを発行
				publishMainStream(userId, 'readAllChannels');
			}
		});
	}

	if (readAntennaNotes.length > 0) {
		await AntennaNotes.update({
			antennaId: In(myAntennas.map(a => a.id)),
			noteId: In(readAntennaNotes.map(n => n.id))
		}, {
			read: true
		});

		// TODO: まとめてクエリしたい
		for (const antenna of myAntennas) {
			const count = await AntennaNotes.count({
				antennaId: antenna.id,
				read: false
			});

			if (count === 0) {
				publishMainStream(userId, 'readAntenna', antenna);
			}
		}

		Users.getHasUnreadAntenna(userId).then(unread => {
			if (!unread) {
				publishMainStream(userId, 'readAllAntennas');
			}
		});
	}
}
