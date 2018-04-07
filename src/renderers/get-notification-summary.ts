import getUserName from '../renderers/get-user-name';
import getPostSummary from './get-post-summary';
import getReactionEmoji from './get-reaction-emoji';

/**
 * 通知を表す文字列を取得します。
 * @param notification 通知
 */
export default function(notification: any): string {
	switch (notification.type) {
		case 'follow':
			return `${getUserName(notification.user)}にフォローされました`;
		case 'mention':
			return `言及されました:\n${getUserName(notification.user)}「${getPostSummary(notification.post)}」`;
		case 'reply':
			return `返信されました:\n${getUserName(notification.user)}「${getPostSummary(notification.post)}」`;
		case 'repost':
			return `Repostされました:\n${getUserName(notification.user)}「${getPostSummary(notification.post)}」`;
		case 'quote':
			return `引用されました:\n${getUserName(notification.user)}「${getPostSummary(notification.post)}」`;
		case 'reaction':
			return `リアクションされました:\n${getUserName(notification.user)} <${getReactionEmoji(notification.reaction)}>「${getPostSummary(notification.post)}」`;
		case 'poll_vote':
			return `投票されました:\n${getUserName(notification.user)}「${getPostSummary(notification.post)}」`;
		default:
			return `<不明な通知タイプ: ${notification.type}>`;
	}
}
