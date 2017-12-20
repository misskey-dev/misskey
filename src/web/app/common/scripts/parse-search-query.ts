export default function(qs: string) {
	const q = {
		text: ''
	};

	qs.split(' ').forEach(x => {
		if (/^([a-z_]+?):(.+?)$/.test(x)) {
			const [key, value] = x.split(':');
			switch (key) {
				case 'user':
					q['username'] = value;
					break;
				case 'follow':
					q['following'] = value == 'null' ? null : value == 'true';
					break;
				case 'reply':
					q['include_replies'] = value == 'true';
					break;
				case 'media':
					q['with_media'] = value == 'true';
					break;
				case 'until':
				case 'since':
					// YYYY-MM-DD
					if (/^[0-9]+\-[0-9]+\-[0-9]+$/) {
						const [yyyy, mm, dd] = value.split('-');
						q[`${key}_date`] = (new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10))).getTime();
					}
					break;
				default:
					q[key] = value;
					break;
			}
		} else {
			q.text += x + ' ';
		}
	});

	if (q.text) {
		q.text = q.text.trim();
	}

	return q;
}
