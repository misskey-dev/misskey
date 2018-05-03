import * as debug from 'debug';

import Resolver from '../../resolver';
import post from '../../../../services/note/create';
import { IRemoteUser } from '../../../../models/user';
import { IAnnounce, INote } from '../../type';
import { fetchNote, resolveNote } from '../../models/note';
import { resolvePerson } from '../../models/person';

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
	let visibleUsers = [];
	if (!note.to.includes('https://www.w3.org/ns/activitystreams#Public')) {
		if (note.cc.includes('https://www.w3.org/ns/activitystreams#Public')) {
			visibility = 'home';
		} else {
			visibility = 'specified';
			visibleUsers = await Promise.all(note.to.map(uri => resolvePerson(uri)));
		}
	}	if (activity.cc.length == 0) visibility = 'followers';
	//#endergion

	await post(actor, {
		createdAt: new Date(activity.published),
		renote,
		visibility,
		visibleUsers,
		uri
	});
}
