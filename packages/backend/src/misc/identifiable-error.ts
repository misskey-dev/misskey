/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ID付きエラー
 */
export class IdentifiableError extends Error {
	public message: string;
	public id: string;

	constructor(id: string, message?: string) {
		super(message);
		this.message = message ?? '';
		this.id = id;
	}
}
