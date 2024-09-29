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
		<div class="_gaps_m">
			<MkButton primary @click="onCreateWebhookClicked">
				<i class="ti ti-plus"></i> {{ i18n.ts._webhookSettings.createWebhook }}
			</MkButton>

			<FormSection>
				<div class="_gaps">
					<XItem v-for="item in webhooks" :key="item.id" :entity="item" @edit="onEditButtonClicked" @delete="onDeleteButtonClicked"/>
				</div>
			</FormSection>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { entities } from 'misskey-js';
import XItem from './system-webhook.item.vue';
import FormSection from '@/components/form/section.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import XHeader from '@/pages/admin/_header_.vue';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { showSystemWebhookEditorDialog } from '@/components/MkSystemWebhookEditor.impl.js';
import * as os from '@/os.js';

const webhooks = ref<entities.SystemWebhook[]>([]);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

async function onCreateWebhookClicked() {
	await showSystemWebhookEditorDialog({
		mode: 'create',
	});

	await fetchWebhooks();
}

async function onEditButtonClicked(webhook: entities.SystemWebhook) {
	await showSystemWebhookEditorDialog({
		mode: 'edit',
		id: webhook.id,
	});

	await fetchWebhooks();
}

async function onDeleteButtonClicked(webhook: entities.SystemWebhook) {
	const result = await os.confirm({
		type: 'warning',
		title: i18n.ts._webhookSettings.deleteConfirm,
	});
	if (!result.canceled) {
		await misskeyApi('admin/system-webhook/delete', {
			id: webhook.id,
		});
		await fetchWebhooks();
	}
}

async function fetchWebhooks() {
	const result = await misskeyApi('admin/system-webhook/list', {});
	webhooks.value = result.sort((a, b) => a.id.localeCompare(b.id));
}

onMounted(async () => {
	await fetchWebhooks();
});

definePageMetadata(() => ({
	title: 'SystemWebhook',
	icon: 'ti ti-webhook',
}));
</script>

<style module lang="scss">

</style>
