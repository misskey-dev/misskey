import getPostSummary from '../../../../renderers/get-post-summary';
import getReactionEmoji from '../../../../renderers/get-reaction-emoji';
import getUserName from '../../../../renderers/get-user-name';

type Notification = {
	title: string;
	body: string;
	icon: string;
	onclick?: any;
};

// TODO: i18n

export default function(type, data): Notification {
	switch (type) {
		case 'drive_file_created':
			return {
				title: 'ファイルがアップロードされました',
				body: data.name,
				icon: data.url + '?thumbnail&size=64'
			};

		case 'mention':
			return {
				title: `${getUserName(data.user)}さんから:`,
				body: getPostSummary(data),
				icon: data.user.avatarUrl + '?thumbnail&size=64'
			};

		case 'reply':
			return {
				title: `${getUserName(data.user)}さんから返信:`,
				body: getPostSummary(data),
				icon: data.user.avatarUrl + '?thumbnail&size=64'
			};

		case 'quote':
			return {
				title: `${getUserName(data.user)}さんが引用:`,
				body: getPostSummary(data),
				icon: data.user.avatarUrl + '?thumbnail&size=64'
			};

		case 'reaction':
			return {
				title: `${getUserName(data.user)}: ${getReactionEmoji(data.reaction)}:`,
				body: getPostSummary(data.post),
				icon: data.user.avatarUrl + '?thumbnail&size=64'
			};

		case 'unread_messaging_message':
			return {
				title: `${getUserName(data.user)}さんからメッセージ:`,
				body: data.text, // TODO: getMessagingMessageSummary(data),
				icon: data.user.avatarUrl + '?thumbnail&size=64'
			};

		case 'othello_invited':
			return {
				title: '対局への招待があります',
				body: `${getUserName(data.parent)}さんから`,
				icon: data.parent.avatarUrl + '?thumbnail&size=64'
			};

		default:
			return null;
	}
}
