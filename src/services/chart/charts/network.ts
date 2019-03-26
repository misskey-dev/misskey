import autobind from 'autobind-decorator';
import Chart, { Partial } from '../core';
import { SchemaType } from '../../../misc/schema';

/**
 * ネットワークに関するチャート
 */
export const networkLogSchema = {
	type: 'object' as 'object',
	properties: {
		incomingRequests: {
			type: 'number' as 'number',
			description: '受信したリクエスト数'
		},
		outgoingRequests: {
			type: 'number' as 'number',
			description: '送信したリクエスト数'
		},
		totalTime: {
			type: 'number' as 'number',
			description: '応答時間の合計' // TIP: (totalTime / incomingRequests) でひとつのリクエストに平均でどれくらいの時間がかかったか知れる
		},
		incomingBytes: {
			type: 'number' as 'number',
			description: '合計受信データ量'
		},
		outgoingBytes: {
			type: 'number' as 'number',
			description: '合計送信データ量'
		},
	}
};

type NetworkLog = SchemaType<typeof networkLogSchema>;

class NetworkChart extends Chart<NetworkLog> {
	constructor() {
		super('network', networkLogSchema);
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

export default new NetworkChart();
