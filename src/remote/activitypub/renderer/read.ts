import config from '@/config';
import { User } from '@/models/entities/user';
import { MessagingMessage } from '../../../models/entities/messaging-message';

export const renderReadActivity = (user: { id: User['id'] }, message: MessagingMessage) => ({
	type: 'Read',
	actor: `${config.url}/users/${user.id}`,
	object: message.uri
});
