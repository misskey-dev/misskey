<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<SearchMarker path="/admin/system-webhook" label="SystemWebhook" :keywords="['webhook']" icon="ti ti-webhook">
			<div class="_gaps_m">
				<SearchMarker>
					<MkButton primary @click="onCreateWebhookClicked">
						<i class="ti ti-plus"></i> <SearchLabel>{{ i18n.ts._webhookSettings.createWebhook }}</SearchLabel>
					</MkButton>
				</SearchMarker>

				<FormSection>
					<div class="_gaps">
						<XItem v-for="item in webhooks" :key="item.id" :entity="item" @edit="onEditButtonClicked" @delete="onDeleteButtonClicked"/>
					</div>
				</FormSection>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { entities } from 'misskey-js';
import XItem from './system-webhook.item.vue';
import FormSection from '@/components/form/section.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
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

definePage(() => ({
	title: 'SystemWebhook',
	icon: 'ti ti-webhook',
}));
</script>

<style module lang="scss">

</style>
