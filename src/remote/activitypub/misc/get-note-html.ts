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
		html += `<p>【投票】<br />${url}</p>`;
	}

	return html;
}
