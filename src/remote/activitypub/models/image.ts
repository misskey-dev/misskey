import * as debug from 'debug';

import uploadFromUrl from '../../../services/drive/upload-from-url';
import { IRemoteUser } from '../../../models/user';
import { IDriveFile } from '../../../models/drive-file';
import Resolver from '../resolver';

const log = debug('misskey:activitypub');

/**
 * Imageを作成します。
 */
export async function createImage(actor: IRemoteUser, value): Promise<IDriveFile> {
	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		return null;
	}

	const image = await new Resolver().resolve(value);

	if (image.url == null) {
		throw new Error('invalid image: url not privided');
	}

	log(`Creating the Image: ${image.url}`);

	return await uploadFromUrl(image.url, actor, null, image.url);
}

/**
 * Imageを解決します。
 *
 * Misskeyに対象のImageが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
 */
export async function resolveImage(actor: IRemoteUser, value: any): Promise<IDriveFile> {
	// TODO

	// リモートサーバーからフェッチしてきて登録
	return await createImage(actor, value);
}
