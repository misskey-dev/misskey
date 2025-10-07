/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { VideoOpfsRequest, VideoOpfsResponse } from '../types/video-opfs-writer.js';

let syncHandle: FileSystemSyncAccessHandle | null = null;
let position = 0;

function post(msg: VideoOpfsResponse) {
	self.postMessage(msg);
}

self.onmessage = async (ev) => {
	const data = ev.data as VideoOpfsRequest;
	if (data.type === 'init') {
		// OPFSファイルのSyncAccessHandleを初期化
		const { fileName } = data;
		try {
			const handle = await navigator.storage.getDirectory();
			const fileHandle = await handle.getFileHandle(fileName, { create: true });
			syncHandle = await fileHandle.createSyncAccessHandle();
			position = 0;
			post({ type: 'init', success: true });
		} catch (err) {
			post({ type: 'init', success: false, error: err?.message || String(err) });
		}
	} else if (data.type === 'write') {
		// チャンク書き込み（同期）
		try {
			syncHandle.write(data.chunk.data, { at: data.chunk.position });
			position += data.chunk.data.byteLength;
			post({ type: 'write', success: true });
		} catch (err) {
			post({ type: 'write', success: false, error: err?.message || String(err) });
		}
	} else if (data.type === 'close') {
		// 書き込み終了
		try {
			syncHandle.close();
			syncHandle = null;
			position = 0;
			post({ type: 'close', success: true });
		} catch (err) {
			post({ type: 'close', success: false, error: err?.message || String(err) });
		}
	}
};
