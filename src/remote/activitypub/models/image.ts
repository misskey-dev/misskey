import * as debug from 'debug';

import uploadFromUrl from '../../../services/drive/upload-from-url';
import { IRemoteUser } from '../../../models/user';
import DriveFile, { IDriveFile } from '../../../models/drive-file';
import Resolver from '../resolver';

const log = debug('misskey:activitypub');

/**
 * Imageを作成します。
 */
export async function createImage(actor: IRemoteUser, value: any): Promise<IDriveFile> {
	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		return null;
	}

	const image = await new Resolver().resolve(value) as any;

	if (image.url == null) {
		throw new Error('invalid image: url not privided');
	}

	log(`Creating the Image: ${image.url}`);

	let file = await uploadFromUrl(image.url, actor, null, image.url, image.sensitive);

	// URLが異なっている場合、同じ画像が以前に異なるURLで登録されていたということなので、
	// URLを更新する
	if (file.metadata.url !== image.url) {
		file = await DriveFile.findOneAndUpdate({ _id: file._id }, {
			$set: {
				'metadata.url': image.url,
				'metadata.uri': image.url
			}
		}, {
			returnNewDocument: true
		});
	}

	return file;
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
