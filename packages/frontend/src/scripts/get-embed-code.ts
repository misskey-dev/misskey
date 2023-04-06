import { url } from '@/config';
import { v4 as uuid } from 'uuid';

/**
 * 埋め込みコードを出力します。
 */
export function getEmbedCode(props: {
	entityType: 'notes';
	id: string;
}): string | null {
	let src: string | undefined = "";
	
	switch (props.entityType) {
		case 'notes':
			src = `${url}/notes/${props.id}/embed`;
			break;
		default:
			src = undefined;
	}

	if (src !== undefined) {
		const id = uuid();
		return `<iframe src="${src}" title="Misskey Embed" style="border:none; width:100%; max-width: 650px; min-height: 300px;" data-msky-embed="${id}"></iframe>
<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.6/js/iframeResizer.min.js" integrity="sha256-86F9vrEnnd2apFWVo5sNxArab6T8L048fPPkYONBDHY=" crossorigin="anonymous"></script>
<script>iFrameResize({}, 'iframe[data-msky-embed="${id}"]');</script>`;
	}
	
	return null;
}
