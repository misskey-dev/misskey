<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="600"
	@close="onClose"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.signup }}</template>

	<div style="overflow-x: clip;">
		<!-- ルール同意画面 -> フォーム画面の2ステップフロー -->
		<Transition
			:name="'MkSignupDialog_' + transitionName"
			mode="out-in"
			@enter="transitionName = 'default'"
		>
			<XRules v-if="phase === 'rules'" key="rules" @done="phase = 'form'" @cancel="onClose"/>
			<XSignup v-else-if="phase === 'form'" key="form" :autoSet="autoSet" @signup="onSignup" @signupEmailPending="onSignupEmailPending"/>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import XRules from '@/components/MkSignupDialog.rules.vue';
import XSignup from '@/components/MkSignupDialog.form.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(ev: 'done', res: Misskey.entities.SignupResponse): void;
	(ev: 'cancelled'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');
// ルール画面から開始する2ステップフロー
const phase = ref<'rules' | 'form'>('rules');
const transitionName = ref<'default' | 'rightToLeft'>('default');

function onClose() {
	emit('cancelled');
	dialog.value?.close();
}

function onSignup(res: Misskey.entities.SignupResponse) {
	emit('done', res);
	dialog.value?.close();
}

function onSignupEmailPending() {
	dialog.value?.close();
}
</script>

