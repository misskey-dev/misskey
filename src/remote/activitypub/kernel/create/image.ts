import { IRemoteUser } from '../../../../models/user';
import { createImage } from '../../models/image';

export default async function(actor: IRemoteUser, image): Promise<void> {
	await createImage(image.url, actor);
}
