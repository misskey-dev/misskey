/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { StreamTargetChunk } from 'mediabunny';

export type VideoOpfsResponse = {
	type: 'init' | 'write' | 'close';
} & ({
	success: true;
} | {
	success: false;
	error: string;
});

export interface VideoOpfsRequestBase {
	type: string;
	fileName: string;
}

export interface VideoOpfsInitRequest extends VideoOpfsRequestBase {
	type: 'init';
};

export interface VideoOpfsWriteRequest extends VideoOpfsRequestBase {
	type: 'write';
	chunk: StreamTargetChunk;
};

export interface VideoOpfsCloseRequest extends VideoOpfsRequestBase {
	type: 'close';
};

export type VideoOpfsRequest = VideoOpfsInitRequest | VideoOpfsWriteRequest | VideoOpfsCloseRequest;
