<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ i18n.ts.password }}</template>
		<MkFolder key="changePasswordKey">
			<template #icon><i class="ti ti-key"></i></template>
			<template #label>{{ i18n.ts.changePassword }}</template>
			<div class="_gaps_s">
				<MkNewPassword ref="newPassword" :label="i18n.ts.newPassword"/>
				<MkButton primary :disabled="!newPassword?.isValid" @click="changePassword">{{ i18n.ts.save }}</MkButton>
			</div>
		</MkFolder>
	</FormSection>

	<X2fa/>

	<FormSection>
		<template #label>{{ i18n.ts.signinHistory }}</template>
		<MkPagination :pagination="pagination" disableAutoLoad>
			<template #default="{items}">
				<div>
					<div v-for="item in items" :key="item.id" v-panel class="timnmucd">
						<header>
							<i v-if="item.success" class="ti ti-check icon succ"></i>
							<i v-else class="ti ti-circle-x icon fail"></i>
							<code class="ip _monospace">{{ item.ip }}</code>
							<MkTime :time="item.createdAt" class="time"/>
						</header>
					</div>
				</div>
			</template>
		</MkPagination>
	</FormSection>

	<FormSection>
		<FormSlot>
			<MkButton danger @click="regenerateToken"><i class="ti ti-refresh"></i> {{ i18n.ts.regenerateLoginToken }}</MkButton>
			<template #caption>{{ i18n.ts.regenerateLoginTokenDescription }}</template>
		</FormSlot>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue';
import X2fa from './2fa.vue';
import FormSection from '@/components/form/section.vue';
import FormSlot from '@/components/form/slot.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkNewPassword from '@/components/MkNewPassword.vue';
import MkButton from '@/components/MkButton.vue';
import MkPagination from '@/components/MkPagination.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const changePasswordKey = ref(Date.now());
const newPassword = shallowRef<InstanceType<typeof MkNewPassword> | null>(null);

const pagination = {
	endpoint: 'i/signin-history' as const,
	limit: 5,
};

async function changePassword() {
	if (!newPassword.value?.isValid) return;

	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	os.apiWithDialog('i/change-password', {
		currentPassword: auth.result.password,
		token: auth.result.token,
		newPassword: newPassword.value.password,
	}).then(() => {
		changePasswordKey.value = Date.now();
	});
}

async function regenerateToken() {
	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	misskeyApi('i/regenerate-token', {
		password: auth.result.password,
		token: auth.result.token,
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.security,
	icon: 'ti ti-lock',
}));
</script>

<style lang="scss" scoped>
.timnmucd {
	padding: 12px;

	&:first-child {
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	&:last-child {
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
	}

	&:not(:last-child) {
		border-bottom: solid 0.5px var(--divider);
	}

	> header {
		display: flex;
		align-items: center;

		> .icon {
			width: 1em;
			margin-right: 0.75em;

			&.succ {
				color: var(--success);
			}

			&.fail {
				color: var(--error);
			}
		}

		> .ip {
			flex: 1;
			min-width: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-right: 12px;
		}

		> .time {
			margin-left: auto;
			opacity: 0.7;
		}
	}
}
</style>
