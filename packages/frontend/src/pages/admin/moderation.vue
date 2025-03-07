<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<FormSuspense :p="init">
				<div class="_gaps_m">
					<MkSwitch :modelValue="enableRegistration" @update:modelValue="onChange_enableRegistration">
						<template #label>{{ i18n.ts._serverSettings.openRegistration }}</template>
						<template #caption>
							<div>{{ i18n.ts._serverSettings.thisSettingWillAutomaticallyOffWhenModeratorsInactive }}</div>
							<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._serverSettings.openRegistrationWarning }}</div>
						</template>
					</MkSwitch>

					<MkSwitch v-model="emailRequiredForSignup" @change="onChange_emailRequiredForSignup">
						<template #label>{{ i18n.ts.emailRequiredForSignup }}</template>
					</MkSwitch>

					<FormLink to="/admin/server-rules">{{ i18n.ts.serverRules }}</FormLink>

					<MkFolder>
						<template #icon><i class="ti ti-lock-star"></i></template>
						<template #label>{{ i18n.ts.preservedUsernames }}</template>

						<div class="_gaps">
							<MkTextarea v-model="preservedUsernames">
								<template #caption>{{ i18n.ts.preservedUsernamesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_preservedUsernames">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-message-exclamation"></i></template>
						<template #label>{{ i18n.ts.sensitiveWords }}</template>

						<div class="_gaps">
							<MkTextarea v-model="sensitiveWords">
								<template #caption>{{ i18n.ts.sensitiveWordsDescription }}<br>{{ i18n.ts.sensitiveWordsDescription2 }}</template>
							</MkTextarea>
							<MkButton primary @click="save_sensitiveWords">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-message-x"></i></template>
						<template #label>{{ i18n.ts.prohibitedWords }}</template>

						<div class="_gaps">
							<MkTextarea v-model="prohibitedWords">
								<template #caption>{{ i18n.ts.prohibitedWordsDescription }}<br>{{ i18n.ts.prohibitedWordsDescription2 }}</template>
							</MkTextarea>
							<MkButton primary @click="save_prohibitedWords">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-user-x"></i></template>
						<template #label>{{ i18n.ts.prohibitedWordsForNameOfUser }}</template>

						<div class="_gaps">
							<MkTextarea v-model="prohibitedWordsForNameOfUser">
								<template #caption>{{ i18n.ts.prohibitedWordsForNameOfUserDescription }}<br>{{ i18n.ts.prohibitedWordsDescription2 }}</template>
							</MkTextarea>
							<MkButton primary @click="save_prohibitedWordsForNameOfUser">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-eye-off"></i></template>
						<template #label>{{ i18n.ts.hiddenTags }}</template>

						<div class="_gaps">
							<MkTextarea v-model="hiddenTags">
								<template #caption>{{ i18n.ts.hiddenTagsDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_hiddenTags">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-eye-off"></i></template>
						<template #label>{{ i18n.ts.silencedInstances }}</template>

						<div class="_gaps">
							<MkTextarea v-model="silencedHosts">
								<template #caption>{{ i18n.ts.silencedInstancesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_silencedHosts">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-eye-off"></i></template>
						<template #label>{{ i18n.ts.mediaSilencedInstances }}</template>

						<div class="_gaps">
							<MkTextarea v-model="mediaSilencedHosts">
								<template #caption>{{ i18n.ts.mediaSilencedInstancesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_mediaSilencedHosts">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-ban"></i></template>
						<template #label>{{ i18n.ts.blockedInstances }}</template>

						<div class="_gaps">
							<MkTextarea v-model="blockedHosts">
								<template #caption>{{ i18n.ts.blockedInstancesDescription }}</template>
							</MkTextarea>
							<MkButton primary @click="save_blockedHosts">{{ i18n.ts.save }}</MkButton>
						</div>
					</MkFolder>
				</div>
			</FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';
import FormLink from '@/components/form/link.vue';
import MkFolder from '@/components/MkFolder.vue';

const enableRegistration = ref<boolean>(false);
const emailRequiredForSignup = ref<boolean>(false);
const sensitiveWords = ref<string>('');
const prohibitedWords = ref<string>('');
const prohibitedWordsForNameOfUser = ref<string>('');
const hiddenTags = ref<string>('');
const preservedUsernames = ref<string>('');
const blockedHosts = ref<string>('');
const silencedHosts = ref<string>('');
const mediaSilencedHosts = ref<string>('');

async function init() {
	const meta = await misskeyApi('admin/meta');
	enableRegistration.value = !meta.disableRegistration;
	emailRequiredForSignup.value = meta.emailRequiredForSignup;
	sensitiveWords.value = meta.sensitiveWords.join('\n');
	prohibitedWords.value = meta.prohibitedWords.join('\n');
	prohibitedWordsForNameOfUser.value = meta.prohibitedWordsForNameOfUser.join('\n');
	hiddenTags.value = meta.hiddenTags.join('\n');
	preservedUsernames.value = meta.preservedUsernames.join('\n');
	blockedHosts.value = meta.blockedHosts.join('\n');
	silencedHosts.value = meta.silencedHosts?.join('\n') ?? '';
	mediaSilencedHosts.value = meta.mediaSilencedHosts.join('\n');
}

async function onChange_enableRegistration(value: boolean) {
	if (value) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts.acknowledgeNotesAndEnable,
		});
		if (canceled) return;
	}

	enableRegistration.value = value;

	os.apiWithDialog('admin/update-meta', {
		disableRegistration: !value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_emailRequiredForSignup(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		emailRequiredForSignup: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function save_preservedUsernames() {
	os.apiWithDialog('admin/update-meta', {
		preservedUsernames: preservedUsernames.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_sensitiveWords() {
	os.apiWithDialog('admin/update-meta', {
		sensitiveWords: sensitiveWords.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_prohibitedWords() {
	os.apiWithDialog('admin/update-meta', {
		prohibitedWords: prohibitedWords.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_prohibitedWordsForNameOfUser() {
	os.apiWithDialog('admin/update-meta', {
		prohibitedWordsForNameOfUser: prohibitedWordsForNameOfUser.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_hiddenTags() {
	os.apiWithDialog('admin/update-meta', {
		hiddenTags: hiddenTags.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function save_blockedHosts() {
	os.apiWithDialog('admin/update-meta', {
		blockedHosts: blockedHosts.value.split('\n') || [],
	}).then(() => {
		fetchInstance(true);
	});
}

function save_silencedHosts() {
	os.apiWithDialog('admin/update-meta', {
		silencedHosts: silencedHosts.value.split('\n') || [],
	}).then(() => {
		fetchInstance(true);
	});
}

function save_mediaSilencedHosts() {
	os.apiWithDialog('admin/update-meta', {
		mediaSilencedHosts: mediaSilencedHosts.value.split('\n') || [],
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.moderation,
	icon: 'ti ti-shield',
}));
</script>
