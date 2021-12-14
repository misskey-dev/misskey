import autobind from 'autobind-decorator';
import Chart, { DeepPartial } from '../core';
import { SchemaType } from '@/misc/schema';
import { name, schema } from './entities/network';

type NetworkLog = SchemaType<typeof schema>;

/**
 * ネットワークに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class NetworkChart extends Chart<NetworkLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: NetworkLog): DeepPartial<NetworkLog> {
		return {};
	}

	@autobind
	protected aggregate(logs: NetworkLog[]): NetworkLog {
		return {
			incomingRequests: logs.reduce((a, b) => a + b.incomingRequests, 0),
			outgoingRequests: logs.reduce((a, b) => a + b.outgoingRequests, 0),
			totalTime: logs.reduce((a, b) => a + b.totalTime, 0),
			incomingBytes: logs.reduce((a, b) => a + b.incomingBytes, 0),
			outgoingBytes: logs.reduce((a, b) => a + b.outgoingBytes, 0),
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<NetworkLog>> {
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
