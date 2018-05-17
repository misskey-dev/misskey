export default function(note) {
	if (note.text == null) return true;

	let txt = note.text;

	if (note.media) {
		note.media.forEach(file => {
			txt = txt.replace(file.url, '');
			if (file.src) txt = txt.replace(file.src, '');
		});

		if (txt == '') return true;
	}

	return false;
}
