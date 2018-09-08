import { INote } from '../../../models/note';
import toHtml from '../../../mfm/html';
import parse from '../../../mfm/parse';
import config from '../../../config';

export default function(note: INote) {
	let html = toHtml(parse(note.text), note.mentionedRemoteUsers);
	if (html == null) html = '';

	if (note.poll != null) {
		const url = `${config.url}/notes/${note._id}`;
		// TODO: i18n
		html += `<p><a href="${url}">【Misskeyで投票を見る】</a></p>`;
	}

	if (note.renoteId != null) {
		const url = `${config.url}/notes/${note.renoteId}`;
		html += `<p>RE: <a href="${url}">${url}</a></p>`;
	}

	return html;
}
