<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<FormSection>
				<template #label>{{ i18n.ts._bulkNotify.title }}</template>
				<div class="_gaps_s">
					<MkInput v-model="notifTitle" :placeholder="i18n.ts._bulkNotify.notificationTitle">
						<template #label>{{ i18n.ts._bulkNotify.notificationTitle }}</template>
					</MkInput>
					<MkTextarea v-model="notifBody" :placeholder="i18n.ts._bulkNotify.notificationBody">
						<template #label>{{ i18n.ts._bulkNotify.notificationBody }}</template>
					</MkTextarea>
					<MkInput v-model="sinceCreatedAt" type="datetime-local">
						<template #label>{{ i18n.ts._bulkNotify.sinceCreatedAt }}</template>
					</MkInput>
					<MkInput v-model="untilCreatedAt" type="datetime-local">
						<template #label>{{ i18n.ts._bulkNotify.untilCreatedAt }}</template>
					</MkInput>
					<MkButton primary :disabled="!canSend || sending" @click="send">
						<i class="ti ti-send"></i>
						{{ sending ? '送信中...' : i18n.ts._bulkNotify.send }}
					</MkButton>
					<div v-if="sentCount != null" style="color: var(--MI_THEME-accent); font-weight: bold;">
						{{ i18n.tsx._bulkNotify.sent({ n: sentCount }) }}
					</div>
				</div>
			</FormSection>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSection from '@/components/form/section.vue';

const notifTitle = ref('');
const notifBody = ref('');
const sinceCreatedAt = ref('');
const untilCreatedAt = ref('');
const sending = ref(false);
const sentCount = ref<number | null>(null);

const canSend = computed(() =>
	notifTitle.value.trim().length > 0 &&
	notifBody.value.trim().length > 0,
);

async function send() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: '全ユーザー（または指定条件のユーザー）に通知を送信します。よろしいですか？',
	});
	if (canceled) return;

	sending.value = true;
	sentCount.value = null;
	try {
		const result = await os.apiWithDialog('admin/bulk-notify', {
			title: notifTitle.value.trim(),
			body: notifBody.value.trim(),
			sinceCreatedAt: sinceCreatedAt.value ? new Date(sinceCreatedAt.value).toISOString() : null,
			untilCreatedAt: untilCreatedAt.value ? new Date(untilCreatedAt.value).toISOString() : null,
		}) as { sentCount: number };
		sentCount.value = result.sentCount;
		notifTitle.value = '';
		notifBody.value = '';
		sinceCreatedAt.value = '';
		untilCreatedAt.value = '';
	} finally {
		sending.value = false;
	}
}

const headerActions = computed(() => []);
const headerTabs = computed(() => []);
</script>
