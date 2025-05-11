/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

type DragDataMap = {
	driveFiles: Misskey.entities.DriveFile[];
	driveFolders: Misskey.entities.DriveFolder[];
	deckColumn: string;
};

export function setDragData<T extends keyof DragDataMap>(
	event: DragEvent,
	type: T,
	data: DragDataMap[T],
) {
	if (event.dataTransfer == null) return;

	event.dataTransfer.setData(`misskey/${type}`, JSON.stringify(data));
}

export function getDragData<T extends keyof DragDataMap>(
	event: DragEvent,
	type: T,
): DragDataMap[T] | null {
	if (event.dataTransfer == null) return null;

	const data = event.dataTransfer.getData(`misskey/${type}`);
	if (data == null || data === '') return null;

	return JSON.parse(data);
}

export function checkDragDataType(
	event: DragEvent,
	types: (keyof DragDataMap)[],
): boolean {
	if (event.dataTransfer == null) return false;

	const dataType = event.dataTransfer.types[0];
	if (dataType == null || dataType === '') return false;

	return types.some((type) => dataType === `misskey/${type}`);
}
