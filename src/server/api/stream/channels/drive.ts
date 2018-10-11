import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'drive';
	public readonly shouldShare = true;

	@autobind
	public async init(params: any) {
		// Subscribe drive stream
		this.subscriber.on(`driveStream:${this.user._id}`, data => {
			this.send(data);
		});
	}
}
