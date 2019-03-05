import renderDocument from './document';
import renderHashtag from './hashtag';
import renderMention from './mention';
import renderEmoji from './emoji';
import config from '../../../config';
import DriveFile, { IDriveFile } from '../../../models/drive-file';
import Note, { INote } from '../../../models/note';
import User from '../../../models/user';
import toHtml from '../misc/get-note-html';
import Emoji, { IEmoji } from '../../../models/emoji';

export default async function renderNote(note: INote, dive = true): Promise<any> {
	const promisedFiles: Promise<IDriveFile[]> = note.fileIds
		? DriveFile.find({ _id: { $in: note.fileIds } })
		: Promise.resolve([]);

	let inReplyTo;
	let inReplyToNote: INote;

	if (note.replyId) {
		inReplyToNote = await Note.findOne({
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

	let quote;

	if (note.renoteId) {
		const renote = await Note.findOne({
			_id: note.renoteId,
		});

		if (renote) {
			quote = renote.uri ? renote.uri : `${config.url}/notes/${renote._id}`;
		}
	}

	const user = await User.findOne({
		_id: note.userId
	});

	const attributedTo = `${config.url}/users/${user._id}`;

	const mentions = note.mentionedRemoteUsers && note.mentionedRemoteUsers.length > 0
		? note.mentionedRemoteUsers.map(x => x.uri)
		: [];

	let to: string[] = [];
	let cc: string[] = [];

	if (note.visibility == 'public') {
		to = ['https://www.w3.org/ns/activitystreams#Public'];
		cc = [`${attributedTo}/followers`].concat(mentions);
	} else if (note.visibility == 'home') {
		to = [`${attributedTo}/followers`];
		cc = ['https://www.w3.org/ns/activitystreams#Public'].concat(mentions);
	} else if (note.visibility == 'followers') {
		to = [`${attributedTo}/followers`];
		cc = mentions;
	} else {
		to = mentions;
	}

	const mentionedUsers = note.mentions ? await User.find({
		_id: {
			$in: note.mentions
		}
	}) : [];

	const hashtagTags = (note.tags || []).map(tag => renderHashtag(tag));
	const mentionTags = mentionedUsers.map(u => renderMention(u));

	const files = await promisedFiles;

	let text = note.text;

	let question: string;
	if (note.poll != null) {
		if (text == null) text = '';
		const url = `${config.url}/notes/${note._id}`;
		// TODO: i18n
		text += `\n[リモートで結果を表示](${url})`;

		question = `${config.url}/questions/${note._id}`;
	}

	let apText = text;
	if (apText == null) apText = '';

	// Provides choices as text for AP
	if (note.poll != null) {
		const cs = note.poll.choices.map(c => `${c.id}: ${c.text}`);
		apText += '\n----------------------------------------\n';
		apText += cs.join('\n');
		apText += '\n----------------------------------------\n';
		apText += '番号を返信して投票';
	}

	if (quote) {
		apText += `\n\nRE: ${quote}`;
	}

	const summary = note.cw === '' ? String.fromCharCode(0x200B) : note.cw;

	const content = toHtml(Object.assign({}, note, {
		text: apText
	}));

	const emojis = await getEmojis(note.emojis);
	const apemojis = emojis.map(emoji => renderEmoji(emoji));

	const tag = [
		...hashtagTags,
		...mentionTags,
		...apemojis,
	];

	const {
		choices = [],
		expiresAt = null,
		multiple = false
	} = note.poll || {};

	const asVote = note.voting ? {
		name: inReplyToNote.poll.choices[parseInt(note.text)].text
	} : {};

	const asPoll = note.poll ? {
		type: 'Question',
		[expiresAt && expiresAt < new Date() ? 'closed' : 'endTime']: expiresAt,
		[multiple ? 'anyOf' : 'oneOf']: choices.map(({ text, votes }) => ({
			type: 'Note',
			name: text,
			replies: {
				type: 'Collection',
				totalItems: votes
			}
		}))
	} : {};

	return {
		id: `${config.url}/notes/${note._id}`,
		type: 'Note',
		attributedTo,
		summary,
		content,
		_misskey_content: text,
		_misskey_quote: quote,
		_misskey_question: question,
		published: note.createdAt.toISOString(),
		to,
		cc,
		inReplyTo,
		attachment: files.map(renderDocument),
		sensitive: files.some(file => file.metadata.isSensitive),
		tag,
		...asPoll,
		...asVote
	};
}

export async function getEmojis(names: string[]): Promise<IEmoji[]> {
	if (names == null || names.length < 1) return [];

	const emojis = await Promise.all(
		names.map(name => Emoji.findOne({
			name,
			host: null
		}))
	);

	return emojis.filter(emoji => emoji != null);
}
