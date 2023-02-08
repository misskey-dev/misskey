<template>
<div class="">
	<FormSuspense :p="init">
		<div class="_gaps">
			<MkButton primary @click="addAccount"><i class="ti ti-plus"></i> {{ i18n.ts.addAccount }}</MkButton>

			<div v-for="account in accounts" :key="account.id" class="_panel _button lcjjdxlm" @click="menu(account, $event)">
				<div class="avatar">
					<MkAvatar :user="account" class="avatar"/>
				</div>
				<div class="body">
					<div class="name">
						<MkUserName :user="account"/>
					</div>
					<div class="acct">
						<MkAcct :user="account"/>
					</div>
				</div>
			</div>
		</div>
	</FormSuspense>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { getAccounts, addAccount as addAccounts, removeAccount as _removeAccount, login, $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const storedAccounts = ref<any>(null);
const accounts = ref<any>(null);

const init = async () => {
	getAccounts().then(accounts => {
		storedAccounts.value = accounts.filter(x => x.id !== $i!.id);

		return os.api('users/show', {
			userIds: storedAccounts.value.map(x => x.id),
		});
	}).then(response => {
		accounts.value = response;
	});
};

function menu(account, ev) {
	os.popupMenu([{
		text: i18n.ts.switch,
		icon: 'ti ti-switch-horizontal',
		action: () => switchAccount(account),
	}, {
		text: i18n.ts.remove,
		icon: 'ti ti-trash',
		danger: true,
		action: () => removeAccount(account),
	}], ev.currentTarget ?? ev.target);
}

function addAccount(ev) {
	os.popupMenu([{
		text: i18n.ts.existingAccount,
		action: () => { addExistingAccount(); },
	}, {
		text: i18n.ts.createAccount,
		action: () => { createAccount(); },
	}], ev.currentTarget ?? ev.target);
}

function removeAccount(account) {
	_removeAccount(account.id);
}

function addExistingAccount() {
	os.popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {}, {
		done: res => {
			addAccounts(res.id, res.i);
			os.success();
		},
	}, 'closed');
}

function createAccount() {
	os.popup(defineAsyncComponent(() => import('@/components/MkSignupDialog.vue')), {}, {
		done: res => {
			addAccounts(res.id, res.i);
			switchAccountWithToken(res.i);
		},
	}, 'closed');
}

async function switchAccount(account: any) {
	const fetchedAccounts: any[] = await getAccounts();
	const token = fetchedAccounts.find(x => x.id === account.id).token;
	switchAccountWithToken(token);
}

function switchAccountWithToken(token: string) {
	login(token);
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.accounts,
	icon: 'ti ti-users',
});
</script>

<style lang="scss" scoped>
.lcjjdxlm {
	display: flex;
	padding: 16px;

	> .avatar {
		display: block;
		flex-shrink: 0;
		margin: 0 12px 0 0;

		> .avatar {
			width: 50px;
			height: 50px;
		}
	}

	> .body {
		display: flex;
		flex-direction: column;
		justify-content: center;
		width: calc(100% - 62px);
		position: relative;

		> .name {
			font-weight: bold;
		}
	}
}
</style>
