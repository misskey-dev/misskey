<template>
<div class="_formRoot">
	<FormSuspense :p="init">
		<FormButton primary @click="addAccount"><i class="fas fa-plus"></i> {{ i18n.ts.addAccount }}</FormButton>

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
	</FormSuspense>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, defineExpose, ref } from 'vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { getAccounts, addAccount as addAccounts, login, $i } from '@/account';
import { i18n } from '@/i18n';

const storedAccounts = ref<any>(null);
const accounts = ref<any>(null);

const init = async () => {
	getAccounts().then(accounts => {
		storedAccounts.value = accounts.filter(x => x.id !== $i!.id);

		console.log(storedAccounts.value);

		return os.api('users/show', {
			userIds: storedAccounts.value.map(x => x.id)
		});
	}).then(response => {
		accounts.value = response;
		console.log(accounts.value);
	});
};

function menu(account, ev) {
	os.popupMenu([{
		text: i18n.ts.switch,
		icon: 'fas fa-exchange-alt',
		action: () => switchAccount(account),
	}, {
		text: i18n.ts.remove,
		icon: 'fas fa-trash-alt',
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

function addExistingAccount() {
	os.popup(defineAsyncComponent(() => import('@/components/signin-dialog.vue')), {}, {
		done: res => {
			addAccounts(res.id, res.i);
			os.success();
		},
	}, 'closed');
}

function createAccount() {
	os.popup(defineAsyncComponent(() => import('@/components/signup-dialog.vue')), {}, {
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

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.accounts,
		icon: 'fas fa-users',
		bg: 'var(--bg)',
	}
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
