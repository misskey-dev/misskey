/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Locator, Page } from 'playwright';

export const BASE_URL = 'http://localhost:61812';
export const ADMIN_SETUP_PASSWORD = 'example_password_please_change_this_or_you_will_get_hacked';

export interface RegisteredUser {
	id: string;
	token: string;
}

//#region Misc
export function assertOk(status: number, route: string): void {
	if (status < 200 || status >= 300) {
		throw new Error(`${route} failed: status=${status}`);
	}
}

export async function resetState(): Promise<void> {
	const response = await fetch(`${BASE_URL}/api/reset-db`, {
		method: 'POST',
		body: '{}',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	assertOk(response.status, '/api/reset-db');
}

export async function registerUser(
	username: string,
	password: string,
	isAdmin = false,
): Promise<RegisteredUser> {
	const route = isAdmin ? '/api/admin/accounts/create' : '/api/signup';
	const response = await fetch(`${BASE_URL}${route}`, {
		method: 'POST',
		body: JSON.stringify({
			username,
			password,
			...(isAdmin ? { setupPassword: ADMIN_SETUP_PASSWORD } : {}),
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	assertOk(response.status, route);
	return await response.json() as RegisteredUser;
}
//#endregion

//#region Locator Helpers
export function locateMkInput(page: Page, testId: string): Locator {
	return page.locator(`[data-testid="${testId}"] input`);
}

export function locateMkTextarea(page: Page, testId: string): Locator {
	return page.locator(`[data-testid="${testId}"] textarea`);
}

export function locateMkSwitch(page: Page, testId: string): Locator {
	return page.locator(`[data-testid="${testId}"] [data-testid="switch-toggle"]`);
}
//#endregion

//#region Page Helpers
export async function visitHome(page: Page): Promise<void> {
	await page.goto(`${BASE_URL}/`);
	await page.locator('button').first().waitFor({ state: 'visible', timeout: 30_000 });
}

export async function waitApiResponse(page: Page, path: string): Promise<void> {
	await page.waitForResponse((response) => {
		return response.url().endsWith(path) && response.request().method() === 'POST';
	}, { timeout: 30_000 });
}

export async function signIn(page: Page, username: string, password: string): Promise<void> {
	await visitHome(page);
	await page.getByTestId('signin').click();
	await page.getByTestId('signin-page-input').waitFor({ state: 'visible', timeout: 10_000 });
	await locateMkInput(page, 'signin-username').fill(username);
	await page.keyboard.press('Enter');
	await page.getByTestId('signin-page-password').waitFor({ state: 'visible', timeout: 10_000 });
	await locateMkInput(page, 'signin-password').fill(password);
	const signinResponse = waitApiResponse(page, '/api/signin-flow');
	await page.keyboard.press('Enter');
	await signinResponse;
}
//#endregion
