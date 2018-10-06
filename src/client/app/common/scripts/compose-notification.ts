import getNoteSummary from '../../../../misc/get-note-summary';
import getReactionEmoji from '../../../../misc/get-reaction-emoji';
import getUserName from '../../../../misc/get-user-name';

type Notification = {
	title: string;
	body: string;
	icon: string;
	onclick?: any;
};

// TODO: i18n

export default function(type, data): Notification {
	switch (type) {
		case 'driveFileCreated':
			return {
				title: '%i18n:common.notification.file-uploaded%',
				body: data.name,
				icon: data.url
			};

		case 'unreadMessagingMessage':
			return {
				title: '%i18n:common.notification.message-from%'.split("{}")[0] + `${getUserName(data.user)}` + '%i18n:common.notification.message-from%'.split("{}")[1] ,
				body: data.text, // TODO: getMessagingMessageSummary(data),
				icon: data.user.avatarUrl
			};

		case 'reversiInvited':
			return {
				title: '%i18n:common.notification.reversi-invited%',
				body: '%i18n:common.notification.reversi-invited-by%'.split("{}")[0] + `${getUserName(data.parent)}` + '%i18n:common.notification.reversi-invited-by%'.split("{}")[1],
				icon: data.parent.avatarUrl
			};

		case 'notification':
			switch (data.type) {
				case 'mention':
					return {
						title: '%i18n:common.notification.notified-by%'.split("{}")[0] + `${getUserName(data.user)}:` + '%i18n:common.notification.notified-by%'.split("{}")[1],
						body: getNoteSummary(data),
						icon: data.user.avatarUrl
					};

				case 'reply':
					return {
						title: '%i18n:common.notification.reply-from%'.split("{}")[0] + `${getUserName(data.user)}` + '%i18n:common.notification.reply-from%'.split("{}")[1],
						body: getNoteSummary(data),
						icon: data.user.avatarUrl
					};

				case 'quote':
					return {
						title: '%i18n:common.notification.quoted-by%'.split("{}")[0] + `${getUserName(data.user)}` + '%i18n:common.notification.quoted-by%'.split("{}")[1],
						body: getNoteSummary(data),
						icon: data.user.avatarUrl
					};

				case 'reaction':
					return {
						title: `${getUserName(data.user)}: ${getReactionEmoji(data.reaction)}:`,
						body: getNoteSummary(data.note),
						icon: data.user.avatarUrl
					};

				default:
					return null;
			}

		default:
			return null;
	}
}
