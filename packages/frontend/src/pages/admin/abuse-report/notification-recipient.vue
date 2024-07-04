<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<XHeader :actions="headerActions" :tabs="headerTabs"/>
	</template>

	<MkSpacer :contentMax="900">
		<div :class="$style.root" class="_gaps_m">
			<div :class="$style.addButton">
				<MkButton primary @click="onAddButtonClicked">
					<span class="ti ti-plus"/> {{ i18n.ts._abuseReport._notificationRecipient.createRecipient }}
				</MkButton>
			</div>
			<div :class="$style.subMenus" class="_gaps_s">
				<MkSelect v-model="filterMethod" style="flex: 1">
					<template #label>{{ i18n.ts._abuseReport._notificationRecipient.recipientType }}</template>
					<option :value="null">-</option>
					<option :value="'email'">{{ i18n.ts._abuseReport._notificationRecipient._recipientType.mail }}</option>
					<option :value="'webhook'">{{ i18n.ts._abuseReport._notificationRecipient._recipientType.webhook }}</option>
				</MkSelect>
				<MkInput v-model="filterText" type="search" style="flex: 1">
					<template #label>{{ i18n.ts._abuseReport._notificationRecipient.keywords }}</template>
				</MkInput>
			</div>

			<MkDivider/>

			<div :class="$style.recipients" class="_gaps_s">
				<XRecipient
					v-for="r in filteredRecipients"
					:key="r.id"
					:entity="r"
					@edit="onEditButtonClicked"
					@delete="onDeleteButtonClicked"
				/>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script setup lang="ts">
import { entities } from 'misskey-js';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import XRecipient from './notification-recipient.item.vue';
import XHeader from '@/pages/admin/_header_.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import MkDivider from '@/components/MkDivider.vue';
import { i18n } from '@/i18n.js';

const recipients = ref<entities.AbuseReportNotificationRecipient[]>([]);

const filterMethod = ref<string | null>(null);
const filterText = ref<string>('');

const filteredRecipients = computed(() => {
	const method = filterMethod.value;
	const text = filterText.value.trim().length === 0 ? null : filterText.value;

	return recipients.value.filter(it => {
		if (method ?? text) {
			if (text) {
				const keywords = [it.name, it.systemWebhook?.name, it.user?.name, it.user?.username];
				if (keywords.filter(k => k?.includes(text)).length !== 0) {
					return true;
				}
			}

			if (method) {
				return it.method.includes(method);
			}

			return false;
		}

		return true;
	});
});
const headerActions = computed(() => []);
const headerTabs = computed(() => []);

async function onAddButtonClicked() {
	await showEditor('create');
}

async function onEditButtonClicked(id: string) {
	await showEditor('edit', id);
}

async function onDeleteButtonClicked(id: string) {
	const res = await os.confirm({
		type: 'warning',
		title: i18n.ts._abuseReport._notificationRecipient.deleteConfirm,
	});
	if (!res.canceled) {
		await misskeyApi('admin/abuse-report/notification-recipient/delete', { id: id });
		await fetchRecipients();
	}
}

async function showEditor(mode: 'create' | 'edit', id?: string) {
	const { dispose, needLoad } = await new Promise<{ dispose: () => void, needLoad: boolean }>(async resolve => {
		const { dispose: _dispose } = os.popup(
			defineAsyncComponent(() => import('./notification-recipient.editor.vue')),
			{
				mode,
				id,
			},
			{
				submitted: async () => {
					resolve({ dispose: _dispose, needLoad: true });
				},
				closed: () => {
					resolve({ dispose: _dispose, needLoad: false });
				},
			},
		);
	});

	dispose();

	if (needLoad) {
		await fetchRecipients();
	}
}

async function fetchRecipients() {
	const result = await misskeyApi('admin/abuse-report/notification-recipient/list', {
		method: ['email', 'webhook'],
	});

	recipients.value = result.sort((a, b) => (a.method + a.id).localeCompare(b.method + b.id));
}

onMounted(async () => {
	await fetchRecipients();
});
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: stretch;
}

.addButton {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
}

.subMenus {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: flex-end;
}

.recipients {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: stretch;
}
</style>
