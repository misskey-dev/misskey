/*
import { ObjectID } from 'mongodb';
import DriveFile from '../drive-file';
*/

// !WIP: Don't use these functions
// TODO: Implement Mastodon media attachment

export type IMastodonAttachment = {
	id: string,
	type: 'unknown' | 'image' | 'gifv' | 'video',
	url: string,
	remote_url?: string,
	preview_url: string,
	text_url?: string,
	meta?: {
		original: IMastodonAttachmentMeta,
		small: IMastodonAttachmentMeta,
		description: string
	}
};

interface IMastodonAttachmentMediaMeta {
	width: number;
	height: number;
}

interface IMastodonAttachmentImageMeta extends IMastodonAttachmentMediaMeta {
	size: string;
	aspect: number;
}

interface IMastodonAttachmentVideoMeta extends IMastodonAttachmentMediaMeta {
	frame_rate: number;
	duration: number;
	bitrate: number;
}

type IMastodonAttachmentMeta = IMastodonAttachmentImageMeta | IMastodonAttachmentVideoMeta;

/*
export async function toMastodonAttachments(ids: ObjectID[]): Promise<IMastodonAttachment[]> {
	return null;
}
*/
