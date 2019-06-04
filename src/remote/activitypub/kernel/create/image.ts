import { IRemoteUser } from '../../../../models/entities/user';
import { createImage } from '../../models/image';

export default async function(actor: IRemoteUser, image: unknown): Promise<void> {
	await createImage(image.url, actor);
}
