import autobind from 'autobind-decorator';
import read from '../../common/read-messaging-message';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'messaging';
	public static shouldShare = false;
	public static requireCredential = true;

	private otherpartyId: string;

	@autobind
	public async init(params: any) {
		this.otherpartyId = params.otherparty as string;

		// Subscribe messaging stream
		this.subscriber.on(`messagingStream:${this.user!.id}-${this.otherpartyId}`, data => {
			this.send(data);
		});
	}

	@autobind
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'read':
				read(this.user!.id, this.otherpartyId, [body.id]);
				break;
		}
	}
}
