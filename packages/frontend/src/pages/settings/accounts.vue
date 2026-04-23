<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/accounts" :label="i18n.ts.accounts" :keywords="['accounts']" icon="ti ti-users">
	<div class="_gaps">
		<div class="_buttons">
			<MkButton primary @click="addAccount"><i class="ti ti-plus"></i> {{ i18n.ts.addAccount }}</MkButton>
			<MkButton @click="refreshAllAccounts"><i class="ti ti-refresh"></i> {{ i18n.ts.reloadAccountsList }}</MkButton>
			<MkButton danger @click="logoutFromAll"><i class="ti ti-power"></i> {{ i18n.ts.logoutFromAll }}</MkButton>
		</div>

		<template v-for="x in accounts" :key="x.host + x.id">
			<MkUserCardMini v-if="x.user" :user="x.user" :class="$style.user" @click.prevent="showMenu(x, $event)">
				<template #nameSuffix>
					<span v-if="x.id === $i?.id" :class="$style.currentAccountTag">{{ i18n.ts.loggingIn }}</span>
				</template>
			</MkUserCardMini>
			<button v-else v-panel class="_button" :class="$style.unknownUser" @click="showMenu(x, $event)">
				<div :class="$style.unknownUserAvatarMock"><i class="ti ti-user-question"></i></div>
				<div>
					<div :class="$style.unknownUserTitle">{{ i18n.ts.unknown }}<span v-if="x.id === $i?.id" :class="$style.currentAccountTag">{{ i18n.ts.loggingIn }}</span></div>
					<div :class="$style.unknownUserSub">ID: <span class="_monospace">{{ x.id }}</span></div>
				</div>
			</button>
		</template>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { host as local } from '@@/js/config.js';
import type { MenuItem } from '@/types/menu.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import { switchAccount, removeAccount, removeAccountAssociatedData, getAccountWithSigninDialog, getAccountWithSignupDialog, getAccounts, refreshAccounts } from '@/accounts.js';
import type { AccountData } from '@/accounts.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { signout } from '@/signout.js';

const accounts = ref<AccountData[]>([]);

getAccounts().then((res) => {
	accounts.value = res;
});

function refreshAllAccounts() {
	os.promiseDialog((async () => {
		await refreshAccounts();
		accounts.value = await getAccounts();
	})());
}

function showMenu(a: AccountData, ev: PointerEvent) {
	const menu: MenuItem[] = [];

	if ($i != null && $i.id === a.id && ($i.host ?? local) === a.host) {
		menu.push({
			text: i18n.ts.logout,
			icon: 'ti ti-power',
			danger: true,
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					title: i18n.ts.logoutConfirm,
					text: i18n.ts.logoutWillClearClientData,
				});
				if (canceled) return;
				signout();
			},
		});
	} else {
		menu.push({
			text: i18n.ts.switch,
			icon: 'ti ti-switch-horizontal',
			action: () => switchAccount(a.host, a.id),
		}, {
			text: i18n.ts.logout,
			icon: 'ti ti-power',
			danger: true,
			action: async () => {
				const { canceled } = await os.confirm({
					type: 'warning',
					title: i18n.tsx.logoutFromOtherAccountConfirm({ username: `<plain>@${a.username}</plain>` }),
					text: i18n.ts.logoutWillClearClientData,
				});
				if (canceled) return;
				await os.promiseDialog((async () => {
					await removeAccount(a.host, a.id);
					await removeAccountAssociatedData(a.host, a.id);
					accounts.value = await getAccounts();
				})());
			},
		});
	}

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function addAccount(ev: PointerEvent) {
	os.popupMenu([{
		text: i18n.ts.existingAccount,
		action: () => { addExistingAccount(); },
	}, {
		text: i18n.ts.createAccount,
		action: () => { createAccount(); },
	}], ev.currentTarget ?? ev.target);
}

async function addExistingAccount() {
	const res = await getAccountWithSigninDialog();
	if (res != null) {
		os.success();
	}
	accounts.value = await getAccounts();
}

async function createAccount() {
	const res = await getAccountWithSignupDialog();
	if (res != null) {
		os.success();
	}
	accounts.value = await getAccounts();
}

async function logoutFromAll() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts.logoutConfirm,
		text: i18n.ts.logoutWillClearClientData,
	});
	if (canceled) return;
	signout(true);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.accounts,
	icon: 'ti ti-users',
}));
</script>

<style lang="scss" module>
.user {
	cursor: pointer;
}

.currentAccountTag {
	display: inline-block;
	margin-left: 8px;
	padding: 0 6px;
	font-size: 0.8em;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	border-radius: calc(var(--MI-radius) / 2);
}

.unknownUser {
	display: flex;
	align-items: center;
	text-align: start;
	padding: 16px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	font-size: 0.9em;
}

.unknownUserAvatarMock {
	display: block;
	width: 34px;
	height: 34px;
	line-height: 34px;
	text-align: center;
	font-size: 16px;
	margin-right: 12px;
	background-color: color-mix(in srgb, var(--MI_THEME-fg), transparent 85%);
	color: color-mix(in srgb, var(--MI_THEME-fg), transparent 25%);
	border-radius: 50%;
}

.unknownUserTitle {
	display: block;
	width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 18px;
}

.unknownUserSub {
	display: block;
	width: 100%;
	font-size: 95%;
	opacity: 0.7;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 16px;
}
</style>
