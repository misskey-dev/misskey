export default function(qs: string) {
	const q = {
		text: ''
	};

	qs.split(' ').forEach(x => {
		if (/^([a-z_]+?):(.+?)$/.test(x)) {
			const [key, value] = x.split(':');
			switch (key) {
				case 'user':
					q['includeUserUsernames'] = value.split(',');
					break;
				case 'exclude_user':
					q['excludeUserUsernames'] = value.split(',');
					break;
				case 'follow':
					q['following'] = value == 'null' ? null : value == 'true';
					break;
				case 'reply':
					q['reply'] = value == 'null' ? null : value == 'true';
					break;
				case 'renote':
					q['renote'] = value == 'null' ? null : value == 'true';
					break;
				case 'media':
					q['media'] = value == 'null' ? null : value == 'true';
					break;
				case 'poll':
					q['poll'] = value == 'null' ? null : value == 'true';
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
