import { types, bool } from '../../../../misc/schema';

/**
 * ネットワークに関するチャート
 */
export const schema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		incomingRequests: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '受信したリクエスト数'
		},
		outgoingRequests: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '送信したリクエスト数'
		},
		totalTime: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '応答時間の合計' // TIP: (totalTime / incomingRequests) でひとつのリクエストに平均でどれくらいの時間がかかったか知れる
		},
		incomingBytes: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '合計受信データ量'
		},
		outgoingBytes: {
			type: types.number,
			optional: bool.false, nullable: bool.false,
			description: '合計送信データ量'
		},
	}
};

export const name = 'network';
