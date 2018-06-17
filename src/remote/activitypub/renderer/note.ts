import renderDocument from './document';
import renderHashtag from './hashtag';
import renderMention from './mention';
import config from '../../../config';
import DriveFile from '../../../models/drive-file';
import Note, { INote } from '../../../models/note';
import User from '../../../models/user';
import toHtml from '../misc/get-note-html';

export default async function renderNote(note: INote, dive = true) {
	const promisedFiles = note.mediaIds
		? DriveFile.find({ _id: { $in: note.mediaIds } })
		: Promise.resolve([]);

	let inReplyTo;

	if (note.replyId) {
		const inReplyToNote = await Note.findOne({
			_id: note.replyId,
		});

		if (inReplyToNote !== null) {
			const inReplyToUser = await User.findOne({
				_id: inReplyToNote.userId,
			});

			if (inReplyToUser !== null) {
				if (inReplyToNote.uri) {
					inReplyTo = inReplyToNote.uri;
				} else {
					if (dive) {
						inReplyTo = await renderNote(inReplyToNote, false);
					} else {
						inReplyTo = `${config.url}/notes/${inReplyToNote._id}`;
					}
				}
			}
		}
	} else {
		inReplyTo = null;
	}

	const user = await User.findOne({
		_id: note.userId
	});

	const attributedTo = `${config.url}/users/${user._id}`;

	const mentions = note.mentionedRemoteUsers && note.mentionedRemoteUsers.length > 0
		? note.mentionedRemoteUsers.map(x => x.uri)
		: [];

	const cc = ['public', 'home', 'followers'].includes(note.visibility)
		? [`${attributedTo}/followers`].concat(mentions)
		: [];

	const hashtagTags = (note.tags || []).map(renderHashtag);
	const mentionTags = (note.mentionedRemoteUsers || []).map(renderMention);
	const tag = hashtagTags.concat(mentionTags);

	return {
		id: `${config.url}/notes/${note._id}`,
		type: 'Note',
		attributedTo,
		summary: note.cw,
		content: toHtml(note),
		published: note.createdAt.toISOString(),
		to: 'https://www.w3.org/ns/activitystreams#Public',
		cc,
		inReplyTo,
		attachment: (await promisedFiles).map(renderDocument),
		tag
	};
}
