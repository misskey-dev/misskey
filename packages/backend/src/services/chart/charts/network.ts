import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { name, schema } from './entities/network';

/**
 * ネットワークに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class NetworkChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected async queryCurrentState(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async update(incomingRequests: number, time: number, incomingBytes: number, outgoingBytes: number): Promise<void> {
		const inc: DeepPartial<NetworkLog> = {
			incomingRequests: incomingRequests,
			totalTime: time,
			incomingBytes: incomingBytes,
			outgoingBytes: outgoingBytes,
		};

		await this.inc(inc);
	}
}
