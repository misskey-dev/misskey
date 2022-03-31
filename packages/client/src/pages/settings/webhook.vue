<template>
<div class="_formRoot">
	<FormSection>
		<FormLink :to="`/settings/webhook/new`">
			Create webhook
		</FormLink>
	</FormSection>
	
	<FormSection>
		<MkPagination :pagination="pagination">
			<template v-slot="{items}">
				<FormLink v-for="webhook in items" :key="webhook.id" :to="`/settings/webhook/edit?id=${webhook.id}`">
					{{ webhook.name || webhook.url }}
				</FormLink>
			</template>
		</MkPagination>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'i/webhooks/list' as const,
	limit: 10,
};

defineExpose({
	[symbols.PAGE_INFO]: {
		title: 'Webhook',
		icon: 'fas fa-bolt',
		bg: 'var(--bg)',
	},
});
</script>
