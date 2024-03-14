<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="800">
		<div v-if="$i">
			<div v-if="name">{{ i18n.tsx._auth.shareAccess({ name }) }}</div>
			<div v-else>{{ i18n.ts._auth.shareAccessAsk }}</div>
			<form :class="$style.buttons" :action="`/sso/${kind}/authorize`" accept-charset="utf-8" method="post">
				<input name="transaction_id" class="mk-input-tr-id-hidden" type="hidden" :value="transactionIdMeta?.content"/>
				<input name="login_token" class="mk-input-token-hidden" type="hidden" :value="$i.token"/>
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

const transactionIdMeta = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:transaction-id"]');
if (transactionIdMeta) {
	transactionIdMeta.remove();
}

const name = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:service-name"]')?.content;
const kind = document.querySelector<HTMLMetaElement>('meta[name="misskey:sso:kind"]')?.content;

function onLogin(res): void {
	login(res.i);
}

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
