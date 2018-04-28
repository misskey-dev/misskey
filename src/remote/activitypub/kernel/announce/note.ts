import * as debug from 'debug';

import Resolver from '../../resolver';
import post from '../../../../services/note/create';
import { IRemoteUser } from '../../../../models/user';
import { IAnnounce, INote } from '../../type';
import { fetchNote, resolveNote } from '../../models/note';

const log = debug('misskey:activitypub');

/**
 * アナウンスアクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, activity: IAnnounce, note: INote): Promise<void> {
	const uri = activity.id || activity;

	if (typeof uri !== 'string') {
		throw new Error('invalid announce');
	}

	// 既に同じURIを持つものが登録されていないかチェック
	const exist = await fetchNote(uri);
	if (exist) {
		return;
	}

	const renote = await resolveNote(note);

	log(`Creating the (Re)Note: ${uri}`);

	//#region Visibility
	let visibility = 'public';
	if (!activity.to.includes('https://www.w3.org/ns/activitystreams#Public')) visibility = 'home';
	if (activity.cc.length == 0) visibility = 'followers';
	// TODO
	if (visibility != 'public') throw new Error('unspported visibility');
	//#endergion

	await post(actor, {
		createdAt: new Date(activity.published),
		renote,
		visibility,
		uri
	});
}
