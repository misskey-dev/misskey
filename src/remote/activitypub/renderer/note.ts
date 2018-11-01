import renderDocument from './document';
import renderHashtag from './hashtag';
import renderMention from './mention';
import renderEmoji from './emoji';
import config from '../../../config';
import DriveFile, { IDriveFile } from '../../../models/drive-file';
import Note, { INote } from '../../../models/note';
import User from '../../../models/user';
import toHtml from '../misc/get-note-html';
import parseMfm from '../../../mfm/parse';
import getEmojiNames from '../misc/get-emoji-names';
import Emoji, { IEmoji } from '../../../models/emoji';
import { unique } from '../../../prelude/array';

export default async function renderNote(note: INote, dive = true): Promise<any> {
	const promisedFiles: Promise<IDriveFile[]> = note.fileIds
		? DriveFile.find({ _id: { $in: note.fileIds } })
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

	if (note.poll != null) {
		if (text == null) text = '';
		const url = `${config.url}/notes/${note._id}`;
		// TODO: i18n
		text += `\n\n[投票を見る](${url})`;
	}

	if (note.renoteId != null) {
		if (text == null) text = '';
		const url = `${config.url}/notes/${note.renoteId}`;
		text += `\n\nRE: ${url}`;
	}

	// 省略されたメンションのホストを復元する
	if (text != null) {
		text = parseMfm(text).map(x => {
			if (x.type == 'mention' && x.host == null) {
				return `${x.content}@${config.host}`;
			} else {
				return x.content;
			}
		}).join('');
	}

	const content = toHtml(Object.assign({}, note, { text }));

	const emojiNames = unique(getEmojiNames(content));
	const emojis = await getEmojis(emojiNames);
	const apemojis = emojis.map(emoji => renderEmoji(emoji));

	const tag = [
		...hashtagTags,
		...mentionTags,
		...apemojis,
	];

	return {
		id: `${config.url}/notes/${note._id}`,
		type: 'Note',
		attributedTo,
		summary: note.cw,
		content,
		_misskey_content: text,
		published: note.createdAt.toISOString(),
		to,
		cc,
		inReplyTo,
		attachment: files.map(renderDocument),
		sensitive: files.some(file => file.metadata.isSensitive),
		tag
	};
}

async function getEmojis(names: string[]): Promise<IEmoji[]> {
	if (names == null || names.length < 1) return [];

	const emojis = await Promise.all(
		names.map(async name => {
			return await Emoji.findOne({
				name,
				host: null
			});
		})
	);

	return emojis.filter(emoji => emoji != null);
}
