/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createStore, promisifyRequest } from 'idb-keyval';

const store = createStore('misskey-shared-files', 'shares');
const lifetime = 60 * 60 * 1000;
const maxPendingShares = 32;
const validId = (id: string | null): id is string => id != null && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

type SharedFiles = { files: File[]; expiresAt: number; ownerId: string | null };

function isUsable(record: SharedFiles | undefined): record is SharedFiles {
	return record != null && Number.isFinite(record.expiresAt) && record.expiresAt > Date.now() && Array.isArray(record.files);
}

export async function cleanupSharedFiles(): Promise<void> {
	await store('readwrite', objectStore => {
		const request = objectStore.openCursor();
		request.onsuccess = () => {
			const cursor = request.result;
			if (!cursor) return;
			if (!isUsable(cursor.value)) cursor.delete();
			cursor.continue();
		};
		return promisifyRequest(objectStore.transaction);
	});
}

export async function saveSharedFiles(files: File[]): Promise<string> {
	await cleanupSharedFiles();
	const id = crypto.randomUUID();
	let full = false;
	await store('readwrite', objectStore => {
		const request = objectStore.count();
		request.onsuccess = () => {
			if (request.result >= maxPendingShares) {
				full = true;
				objectStore.transaction.abort();
				return;
			}
			objectStore.add({ files, expiresAt: Date.now() + lifetime, ownerId: null } satisfies SharedFiles, id);
		};
		return promisifyRequest(objectStore.transaction);
	}).catch(error => {
		if (full) throw new Error('Too many pending shared drafts');
		throw error;
	});
	return id;
}

export async function readSharedFiles(id: string | null, accountId: string | null): Promise<File[]> {
	if (!validId(id) || !accountId) return [];
	await cleanupSharedFiles();
	let files: File[] = [];
	await store('readwrite', objectStore => {
		const request = objectStore.get(id);
		request.onsuccess = () => {
			const record = request.result as SharedFiles | undefined;
			if (!isUsable(record)) {
				objectStore.delete(id);
				return;
			}
			if (record.ownerId != null && record.ownerId !== accountId) return;
			// Claim and read in one transaction so two accounts cannot both claim a share.
			objectStore.put({ ...record, ownerId: accountId }, id);
			files = record.files;
		};
		return promisifyRequest(objectStore.transaction);
	});
	return files;
}

export async function discardSharedFiles(id: string | null, accountId: string | null): Promise<void> {
	if (!validId(id)) return;
	await store('readwrite', objectStore => {
		const request = objectStore.get(id);
		request.onsuccess = () => {
			const record = request.result as SharedFiles | undefined;
			if (record?.ownerId == null || record.ownerId === accountId || !isUsable(record)) objectStore.delete(id);
		};
		return promisifyRequest(objectStore.transaction);
	});
}
