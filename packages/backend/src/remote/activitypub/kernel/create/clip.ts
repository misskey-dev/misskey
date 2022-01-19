import Resolver from '../../resolver';
import { IRemoteUser } from '@/models/entities/user';
import { createClip, fetchClip } from '../../models/clip';
import { getApId, IObject, ICreate, IOrderedCollection } from '../../type';
import { getApLock } from '@/misc/app-lock';
import { extractDbHost } from '@/misc/convert-host';
import { StatusError } from '@/misc/fetch';

/**
 * Clip作成アクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, clip: IOrderedCollection, silent = false, activity?: ICreate): Promise<string> {
	const uri = getApId(clip);

	if (typeof clip === 'object') {
		if (actor.uri !== clip.attributedTo) {
			return `skip: actor.uri !== clip.attributedTo`;
		}

		if (typeof clip.id === 'string') {
			if (extractDbHost(actor.uri) !== extractDbHost(clip.id)) {
				return `skip: host in actor.uri !== clip.id`;
			}
		}
	}

	const unlock = await getApLock(uri);

	try {
		const exist = await fetchClip(clip);
		if (exist) return 'skip: clip exists';

		await createClip(clip, resolver, silent);
		return 'ok';
	} catch (e) {
		if (e instanceof StatusError && e.isClientError) {
			return `skip ${e.statusCode}`;
		} else {
			throw e;
		}
	} finally {
		unlock();
	}
}
