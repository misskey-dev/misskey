import config from '@/config';
import { ILocalUser } from '../../../models/entities/user';
import { MessagingMessage } from '../../../models/entities/messaging-message';

export const renderReadActivity = (user: ILocalUser, message: MessagingMessage) => ({
	type: 'Read',
	actor: `${config.url}/users/${user.id}`,
	object: message.uri
});
