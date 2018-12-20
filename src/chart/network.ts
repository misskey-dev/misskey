import autobind from 'autobind-decorator';
import Chart, { Partial } from './';

/**
 * ネットワークに関するチャート
 */
type NetworkLog = {
	/**
	 * 受信したリクエスト数
	 */
	incomingRequests: number;

	/**
	 * 送信したリクエスト数
	 */
	outgoingRequests: number;

	/**
	 * 応答時間の合計
	 * TIP: (totalTime / incomingRequests) でひとつのリクエストに平均でどれくらいの時間がかかったか知れる
	 */
	totalTime: number;

	/**
	 * 合計受信データ量
	 */
	incomingBytes: number;

	/**
	 * 合計送信データ量
	 */
	outgoingBytes: number;
};

class NetworkChart extends Chart<NetworkLog> {
	constructor() {
		super('network');
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
