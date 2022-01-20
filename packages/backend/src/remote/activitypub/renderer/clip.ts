import config from '@/config/index';
import { Clip } from '@/models/entities/clip';

export function renderClipCreate(clip: Clip) {
	return {
		id: `${config.url}/clips/${clip.id}/activity`,
		actor: `${config.url}/users/${clip.userId}`,
		type: 'Create',
		published: clip.createdAt.toISOString(),
		object: `${config.url}/clips/${clip.id}`,
	} as any;
}
