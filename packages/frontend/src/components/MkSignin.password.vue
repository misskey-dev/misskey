<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper" data-testid="signin-page-password">
	<div class="_gaps" :class="$style.root">
		<div :class="$style.avatar" :style="{ backgroundImage: user ? `url('${user.avatarUrl}')` : undefined }"></div>
		<div :class="$style.welcomeBackMessage">
			<I18n :src="i18n.ts.welcomeBackWithName" tag="span">
				<template #name><Mfm :text="user.name ?? user.username" :plain="true"/></template>
			</I18n>
		</div>

		<!-- password入力 -->
		<form class="_gaps_s" @submit.prevent="emit('passwordSubmitted', password)">
			<!-- ブラウザ オートコンプリート用 -->
			<input type="hidden" name="username" autocomplete="username" :value="user.username">

			<MkInput v-model="password" :placeholder="i18n.ts.password" type="password" autocomplete="current-password webauthn" :withPasswordToggle="true" required autofocus data-testid="signin-password">
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #caption><button class="_textButton" type="button" @click="resetPassword">{{ i18n.ts.forgotPassword }}</button></template>
			</MkInput>

			<MkButton type="submit" large primary rounded style="margin: 0 auto;" data-testid="signin-page-password-continue">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
		</form>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';

import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';

defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

// NOTE: パスワードはこのコンポーネントの外に出たあと保持されない。
// /auth/signin/continue の 1 リクエストで使い切り、以降のステップでは再送しない
const emit = defineEmits<{
	(ev: 'passwordSubmitted', v: string): void;
}>();

const password = ref('');

function resetPassword(): void {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkForgotPassword.vue')), {}, {
		closed: () => dispose(),
	});
}
</script>

<style lang="scss" module>
.wrapper {
	display: flex;
	align-items: center;
	width: 100%;
	min-height: 336px;

	> .root {
		width: 100%;
	}
}

.avatar {
	margin: 0 auto 0 auto;
	width: 64px;
	height: 64px;
	background: color-mix(in srgb, var(--MI_THEME-fg), transparent 85%);
	background-position: center;
	background-size: cover;
	border-radius: 100%;
}

.welcomeBackMessage {
	text-align: center;
	font-size: 1.1em;
}
</style>
