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
					<MkSwitch v-model="enableRegistration">
						<template #label>{{ i18n.ts.enableRegistration }}</template>
					</MkSwitch>

					<MkSwitch v-model="emailRequiredForSignup">
						<template #label>{{ i18n.ts.emailRequiredForSignup }}</template>
					</MkSwitch>

					<FormLink to="/admin/server-rules">{{ i18n.ts.serverRules }}</FormLink>

					<MkInput v-model="tosUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.tosUrl }}</template>
					</MkInput>

					<MkInput v-model="privacyPolicyUrl" type="url">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.privacyPolicyUrl }}</template>
					</MkInput>

					<MkTextarea v-model="preservedUsernames">
						<template #label>{{ i18n.ts.preservedUsernames }}</template>
						<template #caption>{{ i18n.ts.preservedUsernamesDescription }}</template>
					</MkTextarea>

					<MkTextarea v-model="sensitiveWords">
						<template #label>{{ i18n.ts.sensitiveWords }}</template>
						<template #caption>{{ i18n.ts.sensitiveWordsDescription }}<br>{{ i18n.ts.sensitiveWordsDescription2 }}</template>
					</MkTextarea>

					<MkTextarea v-model="prohibitedWords">
						<template #label>{{ i18n.ts.prohibitedWords }}</template>
						<template #caption>{{ i18n.ts.prohibitedWordsDescription }}<br>{{ i18n.ts.prohibitedWordsDescription2 }}</template>
					</MkTextarea>

					<MkTextarea v-model="hiddenTags">
						<template #label>{{ i18n.ts.hiddenTags }}</template>
						<template #caption>{{ i18n.ts.hiddenTagsDescription }}</template>
					</MkTextarea>
				</div>
			</FormSuspense>
		</MkSpacer>
		<template #footer>
			<div :class="$style.footer">
				<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</MkSpacer>
			</div>
		</template>
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

const enableRegistration = ref<boolean>(false);
const emailRequiredForSignup = ref<boolean>(false);
const sensitiveWords = ref<string>('');
const prohibitedWords = ref<string>('');
const hiddenTags = ref<string>('');
const preservedUsernames = ref<string>('');
const tosUrl = ref<string | null>(null);
const privacyPolicyUrl = ref<string | null>(null);

async function init() {
	const meta = await misskeyApi('admin/meta');
	enableRegistration.value = !meta.disableRegistration;
	emailRequiredForSignup.value = meta.emailRequiredForSignup;
	sensitiveWords.value = meta.sensitiveWords.join('\n');
	prohibitedWords.value = meta.prohibitedWords.join('\n');
	hiddenTags.value = meta.hiddenTags.join('\n');
	preservedUsernames.value = meta.preservedUsernames.join('\n');
	tosUrl.value = meta.tosUrl;
	privacyPolicyUrl.value = meta.privacyPolicyUrl;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		disableRegistration: !enableRegistration.value,
		emailRequiredForSignup: emailRequiredForSignup.value,
		tosUrl: tosUrl.value,
		privacyPolicyUrl: privacyPolicyUrl.value,
		sensitiveWords: sensitiveWords.value.split('\n'),
		prohibitedWords: prohibitedWords.value.split('\n'),
		hiddenTags: hiddenTags.value.split('\n'),
		preservedUsernames: preservedUsernames.value.split('\n'),
	}).then(() => {
		fetchInstance();
	});
}

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.moderation,
	icon: 'ti ti-shield',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
