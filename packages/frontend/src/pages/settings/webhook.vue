<template>
<div class="_gaps_m">
	<FormLink :to="`/settings/webhook/new`">
		Create webhook
	</FormLink>

	<FormSection>
		<MkPagination :pagination="pagination">
			<template #default="{items}">
				<FormLink v-for="webhook in items" :key="webhook.id" :to="`/settings/webhook/edit/${webhook.id}`" class="_margin">
					<template #icon>
						<i v-if="webhook.active === false" class="ti ti-player-pause"></i>
						<i v-else-if="webhook.latestStatus === null" class="ti ti-circle"></i>
						<i v-else-if="[200, 201, 204].includes(webhook.latestStatus)" class="ti ti-check" :style="{ color: 'var(--success)' }"></i>
						<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--error)' }"></i>
					</template>
					{{ webhook.name || webhook.url }}
					<template #suffix>
						<MkTime v-if="webhook.latestSentAt" :time="webhook.latestSentAt"></MkTime>
					</template>
				</FormLink>
			</template>
		</MkPagination>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'i/webhooks/list' as const,
	limit: 10,
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: 'Webhook',
	icon: 'ti ti-webhook',
});
</script>
