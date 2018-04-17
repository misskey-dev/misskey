import { JSDOM } from 'jsdom';
import * as debug from 'debug';

import config from '../../../config';
import Resolver from '../resolver';
import Note, { INote } from '../../../models/note';
import post from '../../../services/note/create';
import { INote as INoteActivityStreamsObject, IObject } from '../type';
import { resolvePerson, updatePerson } from './person';
import { resolveImage } from './image';
import { IRemoteUser } from '../../../models/user';

const log = debug('misskey:activitypub');

/**
 * Noteをフェッチします。
 *
 * Misskeyに対象のNoteが登録されていればそれを返します。
 */
export async function fetchNote(value: string | IObject, resolver?: Resolver): Promise<INote> {
	const uri = typeof value == 'string' ? value : value.id;

	// URIがこのサーバーを指しているならデータベースからフェッチ
	if (uri.startsWith(config.url + '/')) {
		return await Note.findOne({ _id: uri.split('/').pop() });
	}

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await Note.findOne({ uri });

	if (exist) {
		return exist;
	}
	//#endregion

	return null;
}

/**
 * Noteを作成します。
 */
export async function createNote(value: any, resolver?: Resolver, silent = false): Promise<INote> {
	if (resolver == null) resolver = new Resolver();

	const object = await resolver.resolve(value) as any;

	if (object == null || object.type !== 'Note') {
		throw new Error('invalid note');
	}

	const note: INoteActivityStreamsObject = object;

	log(`Creating the Note: ${note.id}`);

	// 投稿者をフェッチ
	const actor = await resolvePerson(note.attributedTo) as IRemoteUser;

	//#region Visibility
	let visibility = 'public';
	if (!note.to.includes('https://www.w3.org/ns/activitystreams#Public')) visibility = 'unlisted';
	if (note.cc.length == 0) visibility = 'private';
	// TODO
	if (visibility != 'public') throw new Error('unspported visibility');
	//#endergion

	// 添付メディア
	// TODO: attachmentは必ずしもImageではない
	// TODO: attachmentは必ずしも配列ではない
	const media = note.attachment
		? await Promise.all(note.attachment.map(x => resolveImage(actor, x)))
		: [];

	// リプライ
	const reply = note.inReplyTo ? await resolveNote(note.inReplyTo, resolver) : null;

	const { window } = new JSDOM(note.content);

	// ユーザーの情報が古かったらついでに更新しておく
	if (actor.updatedAt && Date.now() - actor.updatedAt.getTime() > 1000 * 60 * 60 * 24) {
		updatePerson(note.attributedTo);
	}

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
	}, silent);
}

/**
 * Noteを解決します。
 *
 * Misskeyに対象のNoteが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
 */
export async function resolveNote(value: string | IObject, resolver?: Resolver): Promise<INote> {
	const uri = typeof value == 'string' ? value : value.id;

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await fetchNote(uri);

	if (exist) {
		return exist;
	}
	//#endregion

	// リモートサーバーからフェッチしてきて登録
	return await createNote(value, resolver);
}
