import config from '@/config/index';
import { Relay } from '@/models/entities/relay';
import { ILocalUser } from '@/models/entities/user';

export function renderFollowRelay(relay: Relay, relayActor: ILocalUser) {
	const follow = {
		id: `${config.url}/activities/follow-relay/${relay.id}`,
		type: 'Follow',
		actor: `${config.url}/users/${relayActor.id}`,
		object: 'https://www.w3.org/ns/activitystreams#Public'
	};

	return follow;
}
