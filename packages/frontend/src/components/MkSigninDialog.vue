<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal
	ref="modal"
	:preferType="'dialog'"
	@click="onClose"
	@closed="emit('closed')"
>
	<div :class="$style.root">
		<div :class="$style.header">
			<div :class="$style.headerText"><i class="ti ti-login-2"></i> {{ i18n.ts.login }}</div>
			<button :class="$style.closeButton" class="_button" @click="onClose"><i class="ti ti-x"></i></button>
		</div>
		<div :class="$style.content">
			<MkSignin :autoSet="autoSet" :message="message" :openOnRemote="openOnRemote" @login="onLogin"/>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { shallowRef } from 'vue';
import type { OpenOnRemoteOptions } from '@/scripts/please-login.js';
import MkSignin from '@/components/MkSignin.vue';
import MkModal from '@/components/MkModal.vue';
import { i18n } from '@/i18n.js';

withDefaults(defineProps<{
	autoSet?: boolean;
	message?: string,
	openOnRemote?: OpenOnRemoteOptions,
}>(), {
	autoSet: false,
	message: '',
	openOnRemote: undefined,
});

const emit = defineEmits<{
	(ev: 'done', v: Misskey.entities.SigninFlowResponse & { finished: true }): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();

function onClose() {
	emit('cancelled');
	if (modal.value) modal.value.close();
}

function onLogin(res: Misskey.entities.SigninFlowResponse & { finished: true }) {
	emit('done', res);
	if (modal.value) modal.value.close();
}
</script>

<style lang="scss" module>
.root {
	overflow: auto;
	margin: auto;
	position: relative;
	width: 100%;
	max-width: 400px;
	height: 100%;
	max-height: 450px;
	box-sizing: border-box;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.header {
	position: sticky;
	top: 0;
	left: 0;
	width: 100%;
	height: 50px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	font-weight: bold;
	backdrop-filter: var(--MI-blur, blur(15px));
	background: var(--MI_THEME-acrylicBg);
	z-index: 1;
}

.headerText {
	padding: 0 20px;
	box-sizing: border-box;
}

.closeButton {
	margin-left: auto;
	padding: 16px;
	font-size: 16px;
	line-height: 16px;
}

.content {
	padding: 32px;
	box-sizing: border-box;
}
</style>
