/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Page } from 'playwright';
import {
	registerUser as registerUserWithBaseUrl,
	resetState as resetStateWithBaseUrl,
	signIn as signInWithBaseUrl,
	visitHome as visitHomeWithBaseUrl,
} from './shared.js';
export type { RegisteredUser } from './shared.js';
export {
	ADMIN_SETUP_PASSWORD,
	DEFAULT_INVITATION_CODE,
	acceptSignupRules,
	assertOk,
	closeUserSetupDialog,
	closeUserSetupDialogIfVisible,
	locateMkInput,
	locateMkSwitch,
	locateMkTextarea,
	postNote,
	waitApiResponse,
} from './shared.js';

export const BASE_URL = 'http://localhost:61812';

//#region Misc
export async function resetState(): Promise<void> {
	await resetStateWithBaseUrl(BASE_URL);
}

export async function registerUser(
	username: string,
	password: string,
	isAdmin = false,
): ReturnType<typeof registerUserWithBaseUrl> {
	return registerUserWithBaseUrl(BASE_URL, username, password, isAdmin);
}
//#endregion

//#region Page Helpers
export async function visitHome(page: Page): Promise<void> {
	await visitHomeWithBaseUrl(page, BASE_URL);
}

export async function signIn(page: Page, username: string, password: string): Promise<void> {
	await signInWithBaseUrl(page, BASE_URL, username, password);
}
//#endregion
