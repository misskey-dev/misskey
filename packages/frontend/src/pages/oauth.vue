<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="800">
		<div v-if="$i">
			<div v-if="permissions.length > 0">
				<p v-if="name">{{ i18n.t('_auth.permission', { name }) }}</p>
				<p v-else>{{ i18n.ts._auth.permissionAsk }}</p>
				<ul>
					<li v-for="p in permissions" :key="p">{{ i18n.t(`_permissions.${p}`) }}</li>
				</ul>
			</div>
			<div v-if="name">{{ i18n.t('_auth.shareAccess', { name }) }}</div>
			<div v-else>{{ i18n.ts._auth.shareAccessAsk }}</div>
			<form :class="$style.buttons" action="/oauth/decision" accept-charset="utf-8" method="post">
				<input name="login_token" type="hidden" :value="$i.token"/>
				<input name="transaction_id" type="hidden" :value="transactionIdMeta?.content"/>
				<MkButton inline name="cancel" value="cancel">{{ i18n.ts.cancel }}</MkButton>
				<MkButton inline primary>{{ i18n.ts.accept }}</MkButton>
			</form>
		</div>
		<div v-else>
			<p :class="$style.loginMessage">{{ i18n.ts._auth.pleaseLogin }}</p>
			<MkSignin @login="onLogin"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkSignin from '@/components/MkSignin.vue';
import MkButton from '@/components/MkButton.vue';
import { $i, login } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const transactionIdMeta = document.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:transaction-id"]');
if (transactionIdMeta) {
	transactionIdMeta.remove();
}

const name = document.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:client-name"]')?.content;
const permissions = document.querySelector<HTMLMetaElement>('meta[name="misskey:oauth:scope"]')?.content.split(' ') ?? [];

function onLogin(res): void {
	login(res.i);
}

definePageMetadata({
	title: 'OAuth',
	icon: 'ti ti-apps',
});
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
