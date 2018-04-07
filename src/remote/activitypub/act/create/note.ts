import { JSDOM } from 'jsdom';
import * as debug from 'debug';

import Resolver from '../../resolver';
import Note, { INote } from '../../../../models/note';
import post from '../../../../services/note/create';
import { IRemoteUser } from '../../../../models/user';
import resolvePerson from '../../resolve-person';
import createImage from './image';
import config from '../../../../config';

const log = debug('misskey:activitypub');

/**
 * 投稿作成アクティビティを捌きます
 */
export default async function createNote(resolver: Resolver, actor: IRemoteUser, note, silent = false): Promise<INote> {
	if (typeof note.id !== 'string') {
		log(`invalid note: ${JSON.stringify(note, null, 2)}`);
		throw new Error('invalid note');
	}

	// 既に同じURIを持つものが登録されていないかチェックし、登録されていたらそれを返す
	const exist = await Note.findOne({ uri: note.id });
	if (exist) {
		return exist;
	}

	log(`Creating the Note: ${note.id}`);

	//#region Visibility
	let visibility = 'public';
	if (!note.to.includes('https://www.w3.org/ns/activitystreams#Public')) visibility = 'unlisted';
	if (note.cc.length == 0) visibility = 'private';
	// TODO
	if (visibility != 'public') throw new Error('unspported visibility');
	//#endergion

	//#region 添付メディア
	let media = [];
	if ('attachment' in note && note.attachment != null) {
		// TODO: attachmentは必ずしもImageではない
		// TODO: attachmentは必ずしも配列ではない
		media = await Promise.all(note.attachment.map(x => {
			return createImage(actor, x);
		}));
	}
	//#endregion

	//#region リプライ
	let reply = null;
	if ('inReplyTo' in note && note.inReplyTo != null) {
		// リプライ先の投稿がMisskeyに登録されているか調べる
		const uri: string = note.inReplyTo.id || note.inReplyTo;
		const inReplyToNote = uri.startsWith(config.url + '/')
			? await Note.findOne({ _id: uri.split('/').pop() })
			: await Note.findOne({ uri });

		if (inReplyToNote) {
			reply = inReplyToNote;
		} else {
			// 無かったらフェッチ
			const inReplyTo = await resolver.resolve(note.inReplyTo) as any;

			// リプライ先の投稿の投稿者をフェッチ
			const actor = await resolvePerson(inReplyTo.attributedTo) as IRemoteUser;

			// TODO: silentを常にtrueにしてはならない
			reply = await createNote(resolver, actor, inReplyTo);
		}
	}
	//#endregion

	const { window } = new JSDOM(note.content);

	return await post(actor, {
		createdAt: new Date(note.published),
		media,
		reply,
		renote: undefined,
		text: window.document.body.textContent,
		viaMobile: false,
		geo: undefined,
		visibility,
		uri: note.id
	});
}
