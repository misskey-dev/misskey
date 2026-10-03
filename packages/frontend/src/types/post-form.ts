/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export type MinimalChannel = {
	id: string;
	name: string;
	color: string;
	isSensitive: boolean;
	allowRenoteToExternal: boolean;
	userId: string | null;
};

export interface PostFormProps {
	reply?: Misskey.entities.Note | null;
	renote?: Misskey.entities.Note | null;
	channel?: MinimalChannel | null;
	mention?: Misskey.entities.User;
	specified?: Misskey.entities.UserDetailed;
	initialText?: string;
	initialCw?: string;
	initialVisibility?: (typeof Misskey.noteVisibilities)[number];
	initialFiles?: Misskey.entities.DriveFile[];
	initialLocalOnly?: boolean;
	initialVisibleUsers?: Misskey.entities.UserDetailed[];
	initialNote?: Misskey.entities.Note;
	instant?: boolean;
};
