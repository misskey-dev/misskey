<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="800">
		<div v-if="$i && !loading">
			<div v-if="name">{{ i18n.tsx._auth.shareAccess({ name }) }}</div>
			<div v-else>{{ i18n.ts._auth.shareAccessAsk }}</div>
			<div :class="$style.buttons">
				<MkButton @click="onCancel">{{ i18n.ts.cancel }}</MkButton>
				<MkButton primary @click="onAccept">{{ i18n.ts.accept }}</MkButton>
			</div>
		</div>
		<div v-else-if="$i && loading">
			<div>{{ i18n.ts._auth.callback }}</div>
			<MkLoading class="loading"/>
			<div style="display: none">
				<form ref="postBindingForm" method="post" :action="actionUrl" autocomplete="off">
					<input v-for="(value, key) in actionContext" :key="key" :name="key" :value="value" type="hidden"/>
				</form>
			</div>
		</div>
		<div v-else>
			<p :class="$style.loginMessage">{{ i18n.ts._auth.pleaseLogin }}</p>
			<MkSignin @login="onLogin"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted } from 'vue';
import MkSignin from '@/components/MkSignin.vue';
import MkButton from '@/components/MkButton.vue';
import { $i, login } from '@/account.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const transactionIdMeta = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:transaction-id"]');
if (transactionIdMeta) {
	transactionIdMeta.remove();
}
const name = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:service-name"]')?.content;
const kind = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:kind"]')?.content;
const prompt = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:prompt"]')?.content;

const loading = ref(false);
const postBindingForm = ref<HTMLFormElement | null>(null);
const actionUrl = ref<string | undefined>(undefined);
const actionContext = ref<Record<string, string> | null>(null);

function onLogin(res): void {
	login(res.i);
}

function onCancel(): void {
	if (history.length > 1) history.back();
	else location.href = '/';
}

function onAccept(): void {
	loading.value = true;
	os.promiseDialog(authorize());
}

async function authorize(): Promise<void> {
	const res = await fetch(`/sso/${kind}/authorize`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			transaction_id: transactionIdMeta?.content,
			login_token: $i!.token,
		}),
	});
	const json = await res.json();
	if (json.binding === 'post') {
		actionUrl.value = json.action;
		actionContext.value = json.context;
		nextTick(() => {
			postBindingForm.value?.submit();
		});
	} else {
		location.href = json.action;
	}
}

onMounted(() => {
	if ($i && prompt === 'none') {
		onAccept();
	}
});

definePageMetadata(() => ({
	title: 'Single Sign-On',
	icon: 'ti ti-apps',
}));
</script>

<style lang="scss" module>
.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.loginMessage {
	text-align: center;
	margin: 8px 0 24px;
}
</style>
