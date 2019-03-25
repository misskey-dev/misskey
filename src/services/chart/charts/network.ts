import autobind from 'autobind-decorator';
import Chart, { Partial, Log } from '../core';
import { Column, Entity } from 'typeorm';

/**
 * ネットワークに関するチャート
 */
@Entity()
class NetworkLog extends Log {
	/**
	 * 受信したリクエスト数
	 */
	@Column()
	public incomingRequests: number;

	/**
	 * 送信したリクエスト数
	 */
	@Column()
	public outgoingRequests: number;

	/**
	 * 応答時間の合計
	 * TIP: (totalTime / incomingRequests) でひとつのリクエストに平均でどれくらいの時間がかかったか知れる
	 */
	@Column()
	public totalTime: number;

	/**
	 * 合計受信データ量
	 */
	@Column()
	public incomingBytes: number;

	/**
	 * 合計送信データ量
	 */
	@Column()
	public outgoingBytes: number;
}

class NetworkChart extends Chart<NetworkLog> {
	constructor() {
		super('network', NetworkLog);
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
