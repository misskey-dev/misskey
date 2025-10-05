<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/connect" :label="i18n.ts._settings.serviceConnection" :keywords="['app', 'service', 'connect', 'webhook', 'api', 'token']" icon="ti ti-link">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/client-assets/link_3d.png" color="#ff0088">
			<SearchText>{{ i18n.ts._settings.serviceConnectionBanner }}</SearchText>
		</MkFeatureBanner>

		<SearchMarker :keywords="['api', 'app', 'token', 'accessToken']">
			<FormSection>
				<template #label><i class="ti ti-api"></i> <SearchLabel>{{ i18n.ts._settings.api }}</SearchLabel></template>

				<div class="_gaps_m">
					<MkButton primary @click="generateToken">{{ i18n.ts.generateAccessToken }}</MkButton>
					<FormLink to="/settings/apps">{{ i18n.ts.manageAccessTokens }}</FormLink>
					<FormLink to="/api-console" :behavior="isDesktop ? 'window' : null">API console</FormLink>
				</div>
			</FormSection>
		</SearchMarker>

		<SearchMarker :keywords="['webhook']">
			<FormSection>
				<template #label><i class="ti ti-webhook"></i> <SearchLabel>{{ i18n.ts._settings.webhook }}</SearchLabel></template>

				<div class="_gaps_m">
					<FormLink :to="`/settings/webhook/new`">
						{{ i18n.ts._webhookSettings.createWebhook }}
					</FormLink>

					<MkFolder :defaultOpen="true">
						<template #label>{{ i18n.ts.manage }}</template>

						<MkPagination :paginator="paginator" withControl>
							<template #default="{items}">
								<div class="_gaps">
									<FormLink v-for="webhook in items" :key="webhook.id" :to="`/settings/webhook/edit/${webhook.id}`">
										<template #icon>
											<i v-if="webhook.active === false" class="ti ti-player-pause"></i>
											<i v-else-if="webhook.latestStatus === null" class="ti ti-circle"></i>
											<i v-else-if="[200, 201, 204].includes(webhook.latestStatus)" class="ti ti-check" :style="{ color: 'var(--MI_THEME-success)' }"></i>
											<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--MI_THEME-error)' }"></i>
										</template>
										{{ webhook.name || webhook.url }}
										<template #suffix>
											<MkTime v-if="webhook.latestSentAt" :time="webhook.latestSentAt"></MkTime>
										</template>
									</FormLink>
								</div>
							</template>
						</MkPagination>
					</MkFolder>
				</div>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, defineAsyncComponent, markRaw } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import MkFeatureBanner from '@/components/MkFeatureBanner.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { Paginator } from '@/utility/paginator.js';

const isDesktop = ref(window.innerWidth >= 1100);

const paginator = markRaw(new Paginator('i/webhooks/list', {
	limit: 100,
	noPaging: true,
}));

async function generateToken() {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkTokenGenerateWindow.vue').then(x => x.default), {}, {
		done: async result => {
			const { name, permissions } = result;
			const { token } = await misskeyApi('miauth/gen-token', {
				session: null,
				name: name,
				permission: permissions,
			});

			os.alert({
				type: 'success',
				title: i18n.ts.token,
				text: token,
			});
		},
		closed: () => dispose(),
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._settings.serviceConnection,
	icon: 'ti ti-link',
}));
</script>
