export const getSpeechName = (note: any): string => {
	if (note.user.name) return `${note.user.name} さん`;
	if (note.user.username) return `${note.user.username} さん`;
	return '';
};

export const getSpeechText = (note: any): string => {
	if (note.deletedAt) {
		return null;
	}

	if (note.isHidden) {
		return null;
	}

	let text = note.cw != null ? note.cw : note.text ? note.text : null;
	text = text.replace(/https?:\/\/.*/g, 'URL');
	text = text.replace(/#([^\s\.,!\?'"#:\/\[\]]+)/g, () => `hashtag ${RegExp.$1}`);

	let summary = text;

	// ファイルが添付されているとき
	if ((note.files || []).length != 0) {
		summary += ` ${note.files.length}つのファイル`;
	}

	// 投票が添付されているとき
	if (note.poll) {
		summary += ' 投票';
	}
	return summary.trim();
};
