import { INote } from "../../../models/note";
import toHtml from '../../../text/html';
import parse from '../../../text/parse';
import config from '../../../config';

export default function(note: INote) {
	if (note.text == null) return null;

	let html = toHtml(parse(note.text));

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
