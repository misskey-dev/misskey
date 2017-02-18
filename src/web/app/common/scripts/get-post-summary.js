const getPostSummary = post => {
	let summary = post.text ? post.text : '';

	// メディアが添付されているとき
	if (post.media) {
		summary += ` (${post.media.length}つのメディア)`;
	}

	// 投票が添付されているとき
	if (post.poll) {
		summary += ' (投票)';
	}

	// 返信のとき
	if (post.reply_to_id) {
		if (post.reply_to) {
			replySummary = getPostSummary(post.reply_to);
			summary += ` RE: ${replySummary}`;
		} else {
			summary += ' RE: ...';
		}
	}

	// Repostのとき
	if (post.repost_id) {
		if (post.repost) {
			repostSummary = getPostSummary(post.repost);
			summary += ` RP: ${repostSummary}`;
		} else {
			summary += ' RP: ...';
		}
	}

	return summary.trim();
};

module.exports = getPostSummary;
