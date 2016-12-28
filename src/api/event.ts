import * as mongo from 'mongodb';
import * as redis from 'redis';

type ID = string | mongo.ObjectID;

class MisskeyEvent {
	private redisClient: redis.RedisClient;

	constructor() {
		// Connect to Redis
		this.redisClient = redis.createClient(
			config.redis.port, config.redis.host);
	}

	private publish(channel: string, type: string, value?: Object): void {
		const message = value == null ?
			{ type: type } :
			{ type: type, body: value };

		this.redisClient.publish(`misskey:${channel}`, JSON.stringify(message));
	}

	public publishUserStream(userId: ID, type: string, value?: Object): void {
		this.publish(`user-stream:${userId}`, type, typeof value === 'undefined' ? null : value);
	}

	public publishMessagingStream(userId: ID, otherpartyId: ID, type: string, value?: Object): void {
		this.publish(`messaging-stream:${userId}-${otherpartyId}`, type, typeof value === 'undefined' ? null : value);
	}
}

const ev = new MisskeyEvent();

export default ev.publishUserStream.bind(ev);

export const publishMessagingStream = ev.publishMessagingStream.bind(ev);
