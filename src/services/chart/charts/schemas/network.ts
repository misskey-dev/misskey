/**
 * ネットワークに関するチャート
 */
export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		incomingRequests: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '受信したリクエスト数'
		},
		outgoingRequests: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '送信したリクエスト数'
		},
		totalTime: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '応答時間の合計' // TIP: (totalTime / incomingRequests) でひとつのリクエストに平均でどれくらいの時間がかかったか知れる
		},
		incomingBytes: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '合計受信データ量'
		},
		outgoingBytes: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: '合計送信データ量'
		},
	}
};

export const name = 'network';
