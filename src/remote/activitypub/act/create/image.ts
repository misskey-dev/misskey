import * as debug from 'debug';

import Resolver from '../../resolver';
import uploadFromUrl from '../../../../services/drive/upload-from-url';
import { IRemoteUser } from '../../../../models/user';
import { IDriveFile } from '../../../../models/drive-file';

const log = debug('misskey:activitypub');

export default async function(resolver: Resolver, actor: IRemoteUser, image): Promise<IDriveFile> {
	if ('attributedTo' in image && actor.account.uri !== image.attributedTo) {
		log(`invalid image: ${JSON.stringify(image, null, 2)}`);
		throw new Error('invalid image');
	}

	log(`Creating the Image: ${image.id}`);

	return await uploadFromUrl(image.url, actor);
}
