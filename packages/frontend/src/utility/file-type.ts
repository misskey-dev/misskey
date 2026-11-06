/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type DetectableFileType =
	| 'image'
	| 'video'
	| 'midi'
	| 'audio'
	| 'csv'
	| 'pdf'
	| 'textfile'
	| 'archive'
	| 'unknown';

export function getFileType(type: string): DetectableFileType {
	if (type.startsWith('image/')) return 'image';
	if (type.startsWith('video/')) return 'video';
	if (type === 'audio/midi') return 'midi';
	if (type.startsWith('audio/')) return 'audio';
	if (type.endsWith('/csv')) return 'csv';
	if (type.endsWith('/pdf')) return 'pdf';
	if (type.startsWith('text/')) return 'textfile';
	if ([
		'application/zip',
		'application/x-cpio',
		'application/x-bzip',
		'application/x-bzip2',
		'application/java-archive',
		'application/x-rar-compressed',
		'application/x-tar',
		'application/gzip',
		'application/x-7z-compressed',
	].some(archiveType => archiveType === type)) return 'archive';
	return 'unknown';
}

export function getFileTypeIcon(type: DetectableFileType) {
	switch (type) {
		case 'image': return 'ti ti-photo';
		case 'video': return 'ti ti-video';

		case 'audio':
		case 'midi':
			return 'ti ti-file-music';

		case 'csv':
		case 'pdf':
		case 'textfile':
			return 'ti ti-file-text';

		case 'archive': return 'ti ti-file-zip';

		default: return 'ti ti-file';
	}
}
