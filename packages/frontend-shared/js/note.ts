/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const notePage = (note: { id: string }) => {
	return `/notes/${note.id}`;
};
