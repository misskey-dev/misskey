import getUserName from '../renderers/get-user-name';
import getNoteSummary from './get-note-summary';
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
			return `言及されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`;
		case 'reply':
			return `返信されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`;
		case 'renote':
			return `Renoteされました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`;
		case 'quote':
			return `引用されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`;
		case 'reaction':
			return `リアクションされました:\n${getUserName(notification.user)} <${getReactionEmoji(notification.reaction)}>「${getNoteSummary(notification.note)}」`;
		case 'poll_vote':
			return `投票されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`;
		default:
			return `<不明な通知タイプ: ${notification.type}>`;
	}
}
