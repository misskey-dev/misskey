import renderDocument from './document';
import renderHashtag from './hashtag';
import renderMention from './mention';
import renderEmoji from './emoji';
import config from '@/config/index';
import toHtml from '../misc/get-note-html';
import { Note, IMentionedRemoteUsers } from '@/models/entities/note';
import { DriveFile } from '@/models/entities/drive-file';
import { DriveFiles, Notes, Users, Emojis, Polls } from '@/models/index';
import { In } from 'typeorm';
import { Emoji } from '@/models/entities/emoji';
import { Poll } from '@/models/entities/poll';

export default async function renderNote(note: Note, dive = true, isTalk = false): Promise<any> {
	const getPromisedFiles = async (ids: string[]) => {
		if (!ids || ids.length === 0) return [];
		const items = await DriveFiles.find({ id: In(ids) });
		return ids.map(id => items.find(item => item.id === id)).filter(item => item != null) as DriveFile[];
	};

	let inReplyTo;
	let inReplyToNote: Note | undefined;

	if (note.replyId) {
		inReplyToNote = await Notes.findOne(note.replyId);

		if (inReplyToNote != null) {
			const inReplyToUser = await Users.findOne(inReplyToNote.userId);

			if (inReplyToUser != null) {
				if (inReplyToNote.uri) {
					inReplyTo = inReplyToNote.uri;
				} else {
					if (dive) {
						inReplyTo = await renderNote(inReplyToNote, false);
					} else {
						inReplyTo = `${config.url}/notes/${inReplyToNote.id}`;
					}
				}
			}
		}
	} else {
		inReplyTo = null;
	}

	let quote;

	if (note.renoteId) {
		const renote = await Notes.findOne(note.renoteId);

		if (renote) {
			quote = renote.uri ? renote.uri : `${config.url}/notes/${renote.id}`;
		}
	}

	const user = await Users.findOneOrFail(note.userId);

	const attributedTo = `${config.url}/users/${user.id}`;

	const mentions = (JSON.parse(note.mentionedRemoteUsers) as IMentionedRemoteUsers).map(x => x.uri);

	let to: string[] = [];
	let cc: string[] = [];

	if (note.visibility === 'public') {
		to = ['https://www.w3.org/ns/activitystreams#Public'];
		cc = [`${attributedTo}/followers`].concat(mentions);
	} else if (note.visibility === 'home') {
		to = [`${attributedTo}/followers`];
		cc = ['https://www.w3.org/ns/activitystreams#Public'].concat(mentions);
	} else if (note.visibility === 'followers') {
		to = [`${attributedTo}/followers`];
		cc = mentions;
	} else {
		to = mentions;
	}

	const mentionedUsers = note.mentions.length > 0 ? await Users.find({
		id: In(note.mentions)
	}) : [];

	const hashtagTags = (note.tags || []).map(tag => renderHashtag(tag));
	const mentionTags = mentionedUsers.map(u => renderMention(u));

	const files = await getPromisedFiles(note.fileIds);

	const text = note.text;
	let poll: Poll | undefined;

	if (note.hasPoll) {
		poll = await Polls.findOne({ noteId: note.id });
	}

	let apText = text;
	if (apText == null) apText = '';

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

	const asPoll = poll ? {
		type: 'Question',
		content: toHtml(Object.assign({}, note, {
			text: text
		})),
		[poll.expiresAt && poll.expiresAt < new Date() ? 'closed' : 'endTime']: poll.expiresAt,
		[poll.multiple ? 'anyOf' : 'oneOf']: poll.choices.map((text, i) => ({
			type: 'Note',
			name: text,
			replies: {
				type: 'Collection',
				totalItems: poll!.votes[i]
			}
		}))
	} : {};

	const asTalk = isTalk ? {
		_misskey_talk: true
	} : {};

	return {
		id: `${config.url}/notes/${note.id}`,
		type: 'Note',
		attributedTo,
		summary,
		content,
		_misskey_content: text,
		_misskey_quote: quote,
		quoteUrl: quote,
		published: note.createdAt.toISOString(),
		to,
		cc,
		inReplyTo,
		attachment: files.map(renderDocument),
		sensitive: note.cw != null || files.some(file => file.isSensitive),
		tag,
		...asPoll,
		...asTalk
	};
}

export async function getEmojis(names: string[]): Promise<Emoji[]> {
	if (names == null || names.length === 0) return [];

	const emojis = await Promise.all(
		names.map(name => Emojis.findOne({
			name,
			host: null
		}))
	);

	return emojis.filter(emoji => emoji != null) as Emoji[];
}
