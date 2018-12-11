import getUserName from './get-user-name';
import getNoteSummary from './get-note-summary';
import getReactionEmoji from './get-reaction-emoji';
import { switchMap } from '../prelude/functional-syntax';

/**
 * 通知を表す文字列を取得します。
 * @param notification 通知
 */
export default function(notification: any): string {
	return switchMap(notification.type, `<不明な通知タイプ: ${notification.type}>`,
		['follow', `${getUserName(notification.user)}にフォローされました`],
		['mention', `言及されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`],
		['reply', `返信されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`],
		['renote', `Renoteされました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`],
		['quote', `引用されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`],
		['reaction', `リアクションされました:\n${getUserName(notification.user)} <${getReactionEmoji(notification.reaction)}>「${getNoteSummary(notification.note)}」`],
		['poll_vote', `投票されました:\n${getUserName(notification.user)}「${getNoteSummary(notification.note)}」`]);
}
