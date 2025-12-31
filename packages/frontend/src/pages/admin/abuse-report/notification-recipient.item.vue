<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_panel _gaps_s">
	<div :class="$style.rightDivider" style="width: 80px;"><span :class="`ti ${methodIcon}`"/> {{ methodName }}</div>
	<div :class="$style.rightDivider" style="flex: 0.5">{{ entity.name }}</div>
	<div :class="$style.rightDivider" style="flex: 1">
		<div v-if="method === 'email' && user">
			{{
				`${i18n.ts._abuseReport._notificationRecipient.notifiedUser}: ` + ((user.name) ? `${user.name}(${user.username})` : user.username)
			}}
		</div>
		<div v-if="method === 'webhook' && systemWebhook">
			{{ `${i18n.ts._abuseReport._notificationRecipient.notifiedWebhook}: ` + systemWebhook.name }}
		</div>
	</div>
	<div :class="$style.recipientButtons" style="margin-left: auto">
		<button :class="$style.recipientButton" @click="onEditButtonClicked()">
			<span class="ti ti-settings"/>
		</button>
		<button :class="$style.recipientButton" @click="onDeleteButtonClicked()">
			<span class="ti ti-trash"/>
		</button>
	</div>
</div>
</template>

<script setup lang="ts">
import { entities } from 'misskey-js';
import { computed, toRefs } from 'vue';
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'edit', id: entities.AbuseReportNotificationRecipient['id']): void;
	(ev: 'delete', id: entities.AbuseReportNotificationRecipient['id']): void;
}>();

const props = defineProps<{
	entity: entities.AbuseReportNotificationRecipient;
}>();

const { entity } = toRefs(props);

const method = computed(() => entity.value.method);
const user = computed(() => entity.value.user);
const systemWebhook = computed(() => entity.value.systemWebhook);
const methodIcon = computed(() => {
	switch (entity.value.method) {
		case 'email':
			return 'ti-mail';
		case 'webhook':
			return 'ti-webhook';
		default:
			return 'ti-help';
	}
});
const methodName = computed(() => {
	switch (entity.value.method) {
		case 'email':
			return i18n.ts._abuseReport._notificationRecipient._recipientType.mail;
		case 'webhook':
			return i18n.ts._abuseReport._notificationRecipient._recipientType.webhook;
		default:
			return '不明';
	}
});

function onEditButtonClicked() {
	emit('edit', entity.value.id);
}

function onDeleteButtonClicked() {
	emit('delete', entity.value.id);
}
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	padding: 4px 8px;
}

.rightDivider {
	border-right: 0.5px solid var(--MI_THEME-divider);
}

.recipientButtons {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	margin-right: -4;
}

.recipientButton {
	background-color: transparent;
	border: none;
	border-radius: 9999px;
	box-sizing: border-box;
	margin-top: -2px;
	margin-bottom: -2px;
	padding: 8px;

	&:hover {
		background-color: var(--MI_THEME-buttonBg);
	}
}
</style>
