get-post-summary = (post) ~>
	summary = if post.text? then post.text else ''

	# メディアが添付されているとき
	if post.media?
		summary += " (#{post.media.length}枚の画像)"

	# 返信のとき
	if post.reply_to_id?
		if post.reply_to?
			reply-summary = get-post-summary post.reply_to
			summary += " RE: #{reply-summary}"
		else
			summary += " RE: ..."

	# Repostのとき
	if post.repost_id?
		if post.repost?
			repost-summary = get-post-summary post.repost
			summary += " RP: #{repost-summary}"
		else
			summary += " RP: ..."

	return summary.trim!

module.exports = get-post-summary
