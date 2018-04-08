import * as debug from 'debug';

import uploadFromUrl from '../../../services/drive/upload-from-url';
import { IRemoteUser } from '../../../models/user';
import { IDriveFile } from '../../../models/drive-file';

const log = debug('misskey:activitypub');

/**
 * Imageを作成します。
 */
export async function createImage(actor: IRemoteUser, image): Promise<IDriveFile> {
	log(`Creating the Image: ${image.url}`);

	return await uploadFromUrl(image.url, actor);
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
