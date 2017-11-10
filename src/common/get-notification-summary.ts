import getPostSummary from './get-post-summary';
import getReactionEmoji from './get-reaction-emoji';

/**
 * 通知を表す文字列を取得します。
 * @param notification 通知
 */
export default function(notification: any): string {
	switch (notification.type) {
		case 'follow':
			return `${notification.user.name}にフォローされました`;
		case 'mention':
			return `言及されました: ${notification.user.name}「${getPostSummary(notification.post)}」`;
		case 'reply':
			return `返信されました: ${notification.user.name}「${getPostSummary(notification.post)}」`;
		case 'repost':
			return `Repostされました: ${notification.user.name}「${getPostSummary(notification.post)}」`;
		case 'quote':
			return `引用されました: ${notification.user.name}「${getPostSummary(notification.post)}」`;
		case 'reaction':
			return `リアクションされました: ${notification.user.name} <${getReactionEmoji(notification.reaction)}>「${getPostSummary(notification.post)}」`;
		case 'poll_vote':
			return `投票されました: ${notification.user.name}「${getPostSummary(notification.post)}」`;
		default:
			return `<不明な通知タイプ: ${notification.type}>`;
	}
}
