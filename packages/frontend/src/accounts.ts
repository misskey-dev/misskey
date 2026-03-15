/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { apiUrl, host } from '@@/js/config.js';
import type { MenuItem } from '@/types/menu.js';
import { showSuspendedDialog } from '@/utility/show-suspended-dialog.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { waiting, popup, popupMenu, success, alert } from '@/os.js';
import { unisonReload, reloadChannel } from '@/utility/unison-reload.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';
import { $i } from '@/i.js';
import { signout } from '@/signout.js';

type AccountWithToken = Misskey.entities.MeDetailed & { token: string };

export async function getAccounts(): Promise<{
	host: string;
	id: Misskey.entities.User['id'];
	username: Misskey.entities.User['username'];
	user?: Misskey.entities.MeDetailed | null;
	token: string | null;
}[]> {
	const tokens = store.s.accountTokens;
	const accountInfos = store.s.accountInfos;
	const accounts = prefer.s.accounts;
	return accounts.map(([host, user]) => ({
		host,
		id: user.id,
		username: user.username,
		user: accountInfos[host + '/' + user.id],
		token: tokens[host + '/' + user.id] ?? null,
	}));
}

async function addAccount(host: string, user: Misskey.entities.MeDetailed, token: AccountWithToken['token']) {
	if (!prefer.s.accounts.some(x => x[0] === host && x[1].id === user.id)) {
		store.set('accountTokens', { ...store.s.accountTokens, [host + '/' + user.id]: token });
		store.set('accountInfos', { ...store.s.accountInfos, [host + '/' + user.id]: user });
		prefer.commit('accounts', [...prefer.s.accounts, [host, { id: user.id, username: user.username }]]);
	}
}

export async function removeAccount(host: string, id: AccountWithToken['id']) {
	const tokens = JSON.parse(JSON.stringify(store.s.accountTokens));
	delete tokens[host + '/' + id];
	store.set('accountTokens', tokens);
	const accountInfos = JSON.parse(JSON.stringify(store.s.accountInfos));
	delete accountInfos[host + '/' + id];
	store.set('accountInfos', accountInfos);

	prefer.commit('accounts', prefer.s.accounts.filter(x => x[0] !== host || x[1].id !== id));
}

const isAccountDeleted = Symbol('isAccountDeleted');

function fetchAccount(token: string, id?: string, forceShowDialog?: boolean): Promise<Misskey.entities.MeDetailed> {
	return new Promise((done, fail) => {
		window.fetch(`${apiUrl}/i`, {
			method: 'POST',
			body: JSON.stringify({
				i: token,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(res => new Promise<Misskey.entities.MeDetailed | { error: Record<string, any> }>((done2, fail2) => {
				if (res.status >= 500 && res.status < 600) {
					// サーバーエラー(5xx)の場合をrejectとする
					// （認証エラーなど4xxはresolve）
					return fail2(res);
				}
				res.json().then(done2, fail2);
			}))
			.then(async res => {
				if ('error' in res) {
					if (res.error.id === 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370') {
						// SUSPENDED
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await showSuspendedDialog();
						}
					} else if (res.error.id === 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a') {
						// USER_IS_DELETED
						// アカウントが削除されている
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await alert({
								type: 'error',
								title: i18n.ts.accountDeleted,
								text: i18n.ts.accountDeletedDescription,
							});
						}
					} else if (res.error.id === 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14') {
						// AUTHENTICATION_FAILED
						// トークンが無効化されていたりアカウントが削除されたりしている
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await alert({
								type: 'error',
								title: i18n.ts.tokenRevoked,
								text: i18n.ts.tokenRevokedDescription,
							});
						}
					} else {
						await alert({
							type: 'error',
							title: i18n.ts.failedToFetchAccountInformation,
							text: JSON.stringify(res.error),
						});
					}

					fail(isAccountDeleted);
				} else {
					done(res);
				}
			})
			.catch(fail);
	});
}

export function updateCurrentAccount(accountData: Misskey.entities.MeDetailed) {
	if (!$i) return;
	const token = $i.token;
	for (const key of Object.keys($i)) {
		delete $i[key as keyof typeof $i];
	}
	for (const [key, value] of Object.entries(accountData)) {
		($i[key as keyof typeof accountData] as any) = value;
	}
	store.set('accountInfos', { ...store.s.accountInfos, [host + '/' + $i.id]: $i });
	$i.token = token;
	miLocalStorage.setItem('account', JSON.stringify($i));
}

export function updateCurrentAccountPartial(accountData: Partial<Misskey.entities.MeDetailed>) {
	if (!$i) return;
	for (const [key, value] of Object.entries(accountData)) {
		($i[key as keyof typeof accountData] as any) = value;
	}

	store.set('accountInfos', { ...store.s.accountInfos, [host + '/' + $i.id]: $i });

	miLocalStorage.setItem('account', JSON.stringify($i));
}

export async function refreshCurrentAccount() {
	if (!$i) return;
	const me = $i;
	return fetchAccount($i.token, $i.id).then(updateCurrentAccount).catch(reason => {
		if (reason === isAccountDeleted) {
			removeAccount(host, me.id);
			if (Object.keys(store.s.accountTokens).length > 0) {
				login(Object.values(store.s.accountTokens)[0]);
			} else {
				signout();
			}
		}
	});
}

export async function login(token: AccountWithToken['token'], redirect?: string) {
	const showing = ref(true);
	const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkWaitingDialog.vue')), {
		success: false,
		showing: showing,
	}, {
		closed: () => dispose(),
	});

	const me = await fetchAccount(token, undefined, true).catch(reason => {
		showing.value = false;
		throw reason;
	});

	miLocalStorage.setItem('account', JSON.stringify({
		...me,
		token,
	}));

	await addAccount(host, me, token);

	if (redirect) {
		// 他のタブは再読み込みするだけ
		reloadChannel.postMessage(null);
		// このページはredirectで指定された先に移動
		window.location.href = redirect;
		return;
	}

	unisonReload();
}

export async function switchAccount(host: string, id: string) {
	const token = store.s.accountTokens[host + '/' + id];
	if (token) {
		login(token);
	} else {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {}, {
			done: async (res: Misskey.entities.SigninFlowResponse & { finished: true }) => {
				store.set('accountTokens', { ...store.s.accountTokens, [host + '/' + res.id]: res.i });
				login(res.i);
			},
			closed: () => {
				dispose();
			},
		});
	}
}

export async function getAccountMenu(opts: {
	includeCurrentAccount?: boolean;
	withExtraOperation: boolean;
	active?: Misskey.entities.User['id'];
	onChoose?: (account: Misskey.entities.MeDetailed) => void;
}) {
	if ($i == null) throw new Error('No current account');
	const me = $i;

	const callback = opts.onChoose;

	function createItem(host: string, id: Misskey.entities.User['id'], username: Misskey.entities.User['username'], account: Misskey.entities.MeDetailed | null | undefined, token: string | null): MenuItem {
		if (account) {
			return {
				type: 'user' as const,
				user: account,
				active: opts.active != null ? opts.active === id : false,
				action: async () => {
					if (callback) {
						callback(account);
					} else {
						switchAccount(host, id);
					}
				},
			};
		} else if (token != null) {
			return {
				type: 'button' as const,
				text: username,
				active: opts.active != null ? opts.active === id : false,
				action: async () => {
					if (callback) {
						fetchAccount(token, id).then(account => {
							callback(account);
						});
					} else {
						switchAccount(host, id);
					}
				},
			};
		} else { // プロファイルを復元した場合などはアカウントのトークンや詳細情報はstoreにキャッシュされていない
			return {
				type: 'button' as const,
				text: username,
				active: opts.active != null ? opts.active === id : false,
				action: async () => {
					const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {
						initialUsername: username,
					}, {
						done: async (res: Misskey.entities.SigninFlowResponse & { finished: true }) => {
							store.set('accountTokens', { ...store.s.accountTokens, [host + '/' + res.id]: res.i });

							if (callback) {
								fetchAccount(res.i, id).then(account => {
									callback(account);
								});
							} else {
								switchAccount(host, id);
							}
						},
						closed: () => {
							dispose();
						},
					});
				},
			};
		}
	}

	const menuItems: MenuItem[] = [];

	// TODO: $iのホストも比較したいけど通常null
	const accountItems = (await getAccounts().then(accounts => accounts.filter(x => x.id !== me.id))).map(a => createItem(a.host, a.id, a.username, a.user, a.token));

	if (opts.withExtraOperation) {
		menuItems.push({
			type: 'link',
			text: i18n.ts.profile,
			to: `/@${$i.username}`,
			avatar: $i,
		}, {
			type: 'divider',
		});

		if (opts.includeCurrentAccount) {
			menuItems.push(createItem(host, $i.id, $i.username, $i, $i.token));
		}

		menuItems.push(...accountItems);

		menuItems.push({
			type: 'parent',
			icon: 'ti ti-plus',
			text: i18n.ts.addAccount,
			children: [{
				text: i18n.ts.existingAccount,
				action: () => {
					getAccountWithSigninDialog().then(res => {
						if (res != null) {
							success();
						}
					});
				},
			}, {
				text: i18n.ts.createAccount,
				action: () => {
					getAccountWithSignupDialog().then(res => {
						if (res != null) {
							switchAccount(host, res.id);
						}
					});
				},
			}],
		}, {
			type: 'link',
			icon: 'ti ti-users',
			text: i18n.ts.manageAccounts,
			to: '/settings/accounts',
		});
	} else {
		if (opts.includeCurrentAccount) {
			menuItems.push(createItem(host, $i.id, $i.username, $i, $i.token));
		}

		menuItems.push(...accountItems);
	}

	return menuItems;
}

export function getAccountWithSigninDialog(): Promise<{ id: string, token: string } | null> {
	return new Promise((resolve) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {}, {
			done: async (res: Misskey.entities.SigninFlowResponse & { finished: true }) => {
				const user = await fetchAccount(res.i, res.id, true);
				await addAccount(host, user, res.i);
				resolve({ id: res.id, token: res.i });
			},
			cancelled: () => {
				resolve(null);
			},
			closed: () => {
				dispose();
			},
		});
	});
}

export function getAccountWithSignupDialog(): Promise<{ id: string, token: string } | null> {
	return new Promise((resolve) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkSignupDialog.vue')), {}, {
			done: async (res: Misskey.entities.SignupResponse) => {
				const user = JSON.parse(JSON.stringify(res));
				delete user.token;
				await addAccount(host, user, res.token);
				resolve({ id: res.id, token: res.token });
			},
			cancelled: () => {
				resolve(null);
			},
			closed: () => {
				dispose();
			},
		});
	});
}
