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
		<div :class="$style.header"><i class="ti ti-login-2"></i> {{ i18n.ts.login }}</div>
		<button :class="$style.closeButton" class="_button" @click="onClose"><i class="ti ti-x"></i></button>
		<MkSpacer :marginMin="20" :marginMax="28" style="margin: auto;">
			<MkSignin :autoSet="autoSet" :message="message" :openOnRemote="openOnRemote" @login="onLogin"/>
		</MkSpacer>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
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
	(ev: 'done', v: any): void;
	(ev: 'closed'): void;
	(ev: 'cancelled'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();

function onClose() {
	emit('cancelled');
	if (modal.value) modal.value.close();
}

function onLogin(res) {
	emit('done', res);
	if (modal.value) modal.value.close();
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: auto;
	position: relative;
	padding: 32px;
	width: 100%;
	max-width: 400px;
	height: 100%;
	max-height: 450px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
}

.header {
	position: absolute;
	top: 0;
	left: 0;
	font-weight: bold;
	padding: 16px 20px;
}

.closeButton {
	position: absolute;
	z-index: 1;
	top: 0;
	right: 0;
	padding: 16px;
	font-size: 16px;
}
</style>
