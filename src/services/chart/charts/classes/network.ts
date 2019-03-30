import autobind from 'autobind-decorator';
import Chart, { Partial } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { name, schema } from '../schemas/network';

type NetworkLog = SchemaType<typeof schema>;

export default class NetworkChart extends Chart<NetworkLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: NetworkLog): Promise<NetworkLog> {
		return {
			incomingRequests: 0,
			outgoingRequests: 0,
			totalTime: 0,
			incomingBytes: 0,
			outgoingBytes: 0
		};
	}

	@autobind
	public async update(incomingRequests: number, time: number, incomingBytes: number, outgoingBytes: number) {
		const inc: Partial<NetworkLog> = {
			incomingRequests: incomingRequests,
			totalTime: time,
			incomingBytes: incomingBytes,
			outgoingBytes: outgoingBytes
		};

		await this.inc(inc);
	}
}
