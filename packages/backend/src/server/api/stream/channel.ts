import { bindThis } from '@/decorators.js';
import type Connection from '.';

/**
 * Stream channel
 */
export default abstract class Channel {
	protected connection: Connection;
	public id: string;
	public abstract readonly chName: string;
	public static readonly shouldShare: boolean;
	public static readonly requireCredential: boolean;

	protected get user() {
		return this.connection.user;
	}

	protected get userProfile() {
		return this.connection.userProfile;
	}

	protected get following() {
		return this.connection.following;
	}

	protected get muting() {
		return this.connection.muting;
	}

	protected get renoteMuting() {
		return this.connection.renoteMuting;
	}

	protected get blocking() {
		return this.connection.blocking;
	}

	protected get followingChannels() {
		return this.connection.followingChannels;
	}

	protected get subscriber() {
		return this.connection.subscriber;
	}

	constructor(id: string, connection: Connection) {
		this.id = id;
		this.connection = connection;
	}

	@bindThis
	public send(typeOrPayload: any, payload?: any) {
		const type = payload === undefined ? typeOrPayload.type : typeOrPayload;
		const body = payload === undefined ? typeOrPayload.body : payload;

		this.connection.sendMessageToWs('channel', {
			id: this.id,
			type: type,
			body: body,
		});
	}

	public abstract init(params: any): void;
	public dispose?(): void;
	public onMessage?(type: string, body: any): void;
}
