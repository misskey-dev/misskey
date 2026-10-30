<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px;">
		<MkButton primary @click="createKey">{{ i18n.ts._registry.createKey }}</MkButton>

		<div v-if="scopesWithDomain" class="_gaps_m">
			<FormSection v-for="domain in scopesWithDomain" :key="domain.domain ?? 'system'">
				<template #label>{{ domain.domain ? domain.domain.toUpperCase() : i18n.ts.system }}</template>
				<div class="_gaps_s">
					<FormLink v-for="scope in domain.scopes" :to="`/registry/keys/${domain.domain ?? '@'}/${scope.join('/')}`" class="_monospace">{{ scope.length === 0 ? '(root)' : scope.join('/') }}</FormLink>
				</div>
			</FormSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import JSON5 from 'json5';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';

const scopesWithDomain = ref<Misskey.entities.IRegistryScopesWithDomainResponse | null>(null);

function fetchScopes() {
	misskeyApi('i/registry/scopes-with-domain').then(res => {
		scopesWithDomain.value = res;
	});
}

async function createKey() {
	const { canceled, result } = await os.form(i18n.ts._registry.createKey, {
		key: {
			type: 'string',
			label: i18n.ts._registry.key,
		},
		value: {
			type: 'string',
			multiline: true,
			label: i18n.ts.value,
		},
		scope: {
			type: 'string',
			label: i18n.ts._registry.scope,
		},
	});

	if (canceled) return;

	os.apiWithDialog('i/registry/set', {
		scope: result.scope.split('/'),
		key: result.key,
		value: JSON5.parse(result.value),
	}).then(() => {
		fetchScopes();
	});
}

fetchScopes();

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.registry,
	icon: 'ti ti-adjustments',
}));
</script>
