import { createSystemUser } from './create-system-user.js';
import { renderFollowRelay } from '@/remote/activitypub/renderer/follow-relay.js';
import { renderActivity, attachLdSignature } from '@/remote/activitypub/renderer/index.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import { deliver } from '@/queue/index.js';
import { ILocalUser, User } from '@/models/entities/user.js';
import { Users, Relays } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';

const ACTOR_USERNAME = 'relay.actor' as const;

export async function getRelayActor(): Promise<ILocalUser> {
	const user = await Users.findOne({
		host: null,
		username: ACTOR_USERNAME,
	});

	if (user) return user as ILocalUser;

	const created = await createSystemUser(ACTOR_USERNAME);
	return created as ILocalUser;
}

export async function addRelay(inbox: string) {
	const relay = await Relays.insert({
		id: genId(),
		inbox,
		status: 'requesting',
	}).then(x => Relays.findOneOrFail(x.identifiers[0]));

	const relayActor = await getRelayActor();
	const follow = await renderFollowRelay(relay, relayActor);
	const activity = renderActivity(follow);
	deliver(relayActor, activity, relay.inbox);

	return relay;
}

export async function removeRelay(inbox: string) {
	const relay = await Relays.findOne({
		inbox,
	});

	if (relay == null) {
		throw 'relay not found';
	}

	const relayActor = await getRelayActor();
	const follow = renderFollowRelay(relay, relayActor);
	const undo = renderUndo(follow, relayActor);
	const activity = renderActivity(undo);
	deliver(relayActor, activity, relay.inbox);

	await Relays.delete(relay.id);
}

export async function listRelay() {
	const relays = await Relays.find();
	return relays;
}

export async function relayAccepted(id: string) {
	const result = await Relays.update(id, {
		status: 'accepted',
	});

	return JSON.stringify(result);
}

export async function relayRejected(id: string) {
	const result = await Relays.update(id, {
		status: 'rejected',
	});

	return JSON.stringify(result);
}

export async function deliverToRelays(user: { id: User['id']; host: null; }, activity: any) {
	if (activity == null) return;

	const relays = await Relays.find({
		status: 'accepted',
	});
	if (relays.length === 0) return;

	const copy = JSON.parse(JSON.stringify(activity));
	if (!copy.to) copy.to = ['https://www.w3.org/ns/activitystreams#Public'];

	const signed = await attachLdSignature(copy, user);

	for (const relay of relays) {
		deliver(user, signed, relay.inbox);
	}
}
