import Connection from '..';

/**
 * Stream channel
 */
export default abstract class Channel {
	protected connection: Connection;
	public id: string;

	protected get user() {
		return this.connection.user;
	}

	protected get subscriber() {
		return this.connection.subscriber;
	}

	constructor(id: string, connection: Connection) {
		this.id = id;
		this.connection = connection;
	}

	public send = (typeOrPayload: any, payload?: any) => {
		const data = payload === undefined ? typeOrPayload : {
			type: typeOrPayload,
			body: payload
		};

		this.connection.sendMessageToWs('channel', {
			id: this.id,
			data: data
		});
	}

	public abstract init: (params: any) => void;
	public dispose?: () => void;
	public onMessage?: (type: string, body: any) => void;
}
