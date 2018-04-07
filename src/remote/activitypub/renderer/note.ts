import renderDocument from './document';
import renderHashtag from './hashtag';
import config from '../../../config';
import DriveFile from '../../../models/drive-file';
import Note, { INote } from '../../../models/note';
import User from '../../../models/user';

export default async (note: INote) => {
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
				inReplyTo = inReplyToNote.uri || `${config.url}/notes/${inReplyToNote._id}`;
			}
		}
	} else {
		inReplyTo = null;
	}

	const user = await User.findOne({
		_id: note.userId
	});

	const attributedTo = `${config.url}/@${user.username}`;

	return {
		id: `${config.url}/notes/${note._id}`,
		type: 'Note',
		attributedTo,
		content: note.textHtml,
		published: note.createdAt.toISOString(),
		to: 'https://www.w3.org/ns/activitystreams#Public',
		cc: `${attributedTo}/followers`,
		inReplyTo,
		attachment: (await promisedFiles).map(renderDocument),
		tag: (note.tags || []).map(renderHashtag)
	};
};
