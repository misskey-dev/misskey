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
				title: 'File uploaded',
				body: data.name,
				icon: data.url
			};

		case 'unreadMessagingMessage':
			return {
				title: `New message from ${getUserName(data.user)}`,
				body: data.text, // TODO: getMessagingMessageSummary(data),
				icon: data.user.avatarUrl
			};

		case 'reversiInvited':
			return {
				title: 'Play reversi with me',
				body: `You got reversi invitation from ${getUserName(data.parent)}`,
				icon: data.parent.avatarUrl
			};

		case 'notification':
			switch (data.type) {
				case 'mention':
					return {
						title: `${getUserName(data.user)}:`,
						body: getNoteSummary(data),
						icon: data.user.avatarUrl
					};

				case 'reply':
					return {
						title: `You got reply from ${getUserName(data.user)}:`,
						body: getNoteSummary(data),
						icon: data.user.avatarUrl
					};

				case 'quote':
					return {
						title: `${getUserName(data.user)}:`,
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
