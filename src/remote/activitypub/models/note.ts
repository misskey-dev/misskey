import * as mongo from 'mongodb';
import * as parse5 from 'parse5';
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

function parse(tag, html: string): string {
	const dom = parse5.parseFragment(html) as parse5.AST.Default.Document;

	let text = '';

	dom.childNodes.forEach(n => analyze(n));

	return text.trim();

	function analyze(node) {
		switch (node.nodeName) {
			case '#text':
				text += node.value;
				break;

			case 'br':
				text += '\n';
				break;

			case 'a':
				const cls = node.attrs
					? (node.attrs.find(x => x.name == 'class') || { value: '' }).value.split(' ')
					: [];

				// for Mastodon
				if (cls.includes('mention')) {
					//#region ホスト名部分が省略されているので復元する

					// Activityのtag情報に次のような形で省略前の情報が添付されているのでそこから持ってくる
					// {
					//   "type": "Mention",
					//   "href": "https://misskey.xyz/users/57d01a501fdf2d07be417afe",
					//   "name": "@syuilo@misskey.xyz"
					// }

					const href = node.attrs.find(x => x.name == 'href').value;
					const acct = tag.find(t => t.type == 'Mention' && t.href == href).name;

					text += acct;

					break;

					//#endregion
				}

				if (node.childNodes) {
					node.childNodes.forEach(n => analyze(n));
				}
				break;

			case 'p':
				text += '\n\n';
				if (node.childNodes) {
					node.childNodes.forEach(n => analyze(n));
				}
				break;

			default:
				if (node.childNodes) {
					node.childNodes.forEach(n => analyze(n));
				}
				break;
		}
	}
}

/**
 * Noteをフェッチします。
 *
 * Misskeyに対象のNoteが登録されていればそれを返します。
 */
export async function fetchNote(value: string | IObject, resolver?: Resolver): Promise<INote> {
	const uri = typeof value == 'string' ? value : value.id;

	// URIがこのサーバーを指しているならデータベースからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const id = new mongo.ObjectID(uri.split('/').pop());
		return await Note.findOne({ _id: id });
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
		log(`invalid note: ${object}`);
		return null;
	}

	const note: INoteActivityStreamsObject = object;

	log(`Creating the Note: ${note.id}`);

	// 投稿者をフェッチ
	const actor = await resolvePerson(note.attributedTo) as IRemoteUser;

	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		return null;
	}

	//#region Visibility
	let visibility = 'public';
	let visibleUsers = [];
	if (!note.to.includes('https://www.w3.org/ns/activitystreams#Public')) {
		if (note.cc.includes('https://www.w3.org/ns/activitystreams#Public')) {
			visibility = 'home';
		} else {
			visibility = 'specified';
			visibleUsers = await Promise.all(note.to.map(uri => resolvePerson(uri)));
		}
	}
	if (note.cc.length == 0) visibility = 'followers';
	//#endergion

	// 添付メディア
	// TODO: attachmentは必ずしもImageではない
	// TODO: attachmentは必ずしも配列ではない
	const media = note.attachment
		? await Promise.all(note.attachment.map(x => resolveImage(actor, x)))
		: [];

	// リプライ
	const reply = note.inReplyTo ? await resolveNote(note.inReplyTo, resolver) : null;

	// テキストのパース
	const text = parse(note.tag, note.content);

	// ユーザーの情報が古かったらついでに更新しておく
	if (actor.updatedAt == null || Date.now() - actor.updatedAt.getTime() > 1000 * 60 * 60 * 24) {
		updatePerson(note.attributedTo);
	}

	return await post(actor, {
		createdAt: new Date(note.published),
		media,
		reply,
		renote: undefined,
		text: text,
		viaMobile: false,
		geo: undefined,
		visibility,
		visibleUsers,
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
