import autobind from 'autobind-decorator';
import Connection from '.';

/**
 * Stream channel
 */
export default abstract class Channel {
	protected connection: Connection;
	public id: string;
	public abstract readonly chName: string;
	public abstract readonly shouldShare: boolean;

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

	@autobind
	public send(typeOrPayload: any, payload?: any) {
		const type = payload === undefined ? typeOrPayload.type : typeOrPayload;
		const body = payload === undefined ? typeOrPayload.body : payload;

		this.connection.sendMessageToWs('channel', {
			id: this.id,
			type: type,
			body: body
		});
	}

	public abstract init(params: any): void;
	public dispose?(): void;
	public onMessage?(type: string, body: any): void;
}
