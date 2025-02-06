/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 環境変数を経由するので名前の衝突を避けるためにアンダースコアを付ける
export type WorkerArguments = {
	__workerIndex: number;
	__workerName?: string;
	__moduleServer: boolean;
	__moduleJobQueue: boolean;
}
