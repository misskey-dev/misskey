<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<FormSuspense :p="init">
			<div class="_gaps_m">
				<MkSwitch :modelValue="enableRegistration" @update:modelValue="onChange_enableRegistration">
					<template #label>{{ i18n.ts._serverSettings.openRegistration }}</template>
					<template #caption>
						<div>{{ i18n.ts._serverSettings.thisSettingWillAutomaticallyOffWhenModeratorsInactive }}</div>
						<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._serverSettings.openRegistrationWarning }}</div>
					</template>
				</MkSwitch>

				<MkSwitch v-model="emailInquiredForSignup" @change="onChange_emailInquiredForSignup">
					<template #label>{{ i18n.ts.emailInquiredForSignup }}<span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
					<template #caption>{{ i18n.ts.emailInquiredForSignupDescription }}</template>
				</MkSwitch>

				<MkSwitch
					v-if="emailInquiredForSignup"
					v-model="emailRequiredForSignup"
					:disabled="!emailInquiredForSignup"
					@change="onChange_emailRequiredForSignup"
				>
					<template #label>{{ i18n.ts.emailRequiredForSignup }} ({{ i18n.ts.recommended }})</template>
					<template #caption>{{ i18n.ts.emailRequiredForSignupDescription }}</template>
				</MkSwitch>

				<MkSwitch v-model="approvalRequiredForSignup" @change="onChange_approvalRequiredForSignup">
					<template #label>{{ i18n.ts.approvalRequiredForSignup }}<span class="_beta">{{ i18n.ts.originalFeature }}</span></template>
					<template #caption>{{ i18n.ts.registerApprovalEmailRecommended }}</template>
				</MkSwitch>

				<MkSelect v-model="ugcVisibilityForVisitor" @update:modelValue="onChange_ugcVisibilityForVisitor">
					<template #label>{{ i18n.ts._serverSettings.userGeneratedContentsVisibilityForVisitor }}</template>
					<option value="all">{{ i18n.ts._serverSettings._userGeneratedContentsVisibilityForVisitor.all }}</option>
					<option value="local">{{ i18n.ts._serverSettings._userGeneratedContentsVisibilityForVisitor.localOnly }} ({{ i18n.ts.recommended }})</option>
					<option value="none">{{ i18n.ts._serverSettings._userGeneratedContentsVisibilityForVisitor.none }}</option>
					<template #caption>
						<div>{{ i18n.ts._serverSettings.userGeneratedContentsVisibilityForVisitor_description }}</div>
						<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._serverSettings.userGeneratedContentsVisibilityForVisitor_description2 }}</div>
					</template>
				</MkSelect>

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

				<MkFolder>
					<template #icon><i class="ti ti-exchange"></i></template>
					<template #label>{{ i18n.ts._settings.yamiNoteFederation }}</template>

					<div class="_gaps">
						<MkSwitch
							v-model="yamiNoteFederationEnabled"
							@update:modelValue="onChange_yamiNoteFederationEnabled"
						>
							{{ i18n.ts._yami.yamiNoteFederationEnabled }}<span class="_beta">{{ i18n.ts.originalFeature }}</span>
						</MkSwitch>

						<div v-if="yamiNoteFederationEnabled" class="_gaps">
							<MkTextarea v-model="yamiNoteFederationTrustedInstances">
								<template #label>{{ i18n.ts._yami.yamiNoteFederationTrustedInstances }}</template>
								<template #caption>{{ i18n.ts._yami.yamiNoteFederationTrustedInstancesDescription }}</template>
							</MkTextarea>

							<MkInfo warn>{{ i18n.ts._yami.yamiNoteFederationWarning }}</MkInfo>

							<MkButton primary @click="save_yamiNoteFederationTrustedInstances">{{ i18n.ts.save }}</MkButton>
						</div>
					</div>
				</MkFolder>
			</div>
		</FormSuspense>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';
import FormLink from '@/components/form/link.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkSelect from '@/components/MkSelect.vue';

const enableRegistration = ref<boolean>(false);
const emailInquiredForSignup = ref<boolean>(false);
const emailRequiredForSignup = ref<boolean>(false);
const approvalRequiredForSignup = ref<boolean>(false);
const ugcVisibilityForVisitor = ref<string>('all');
const sensitiveWords = ref<string>('');
const prohibitedWords = ref<string>('');
const prohibitedWordsForNameOfUser = ref<string>('');
const hiddenTags = ref<string>('');
const preservedUsernames = ref<string>('');
const blockedHosts = ref<string>('');
const silencedHosts = ref<string>('');
const mediaSilencedHosts = ref<string>('');
const yamiNoteFederationEnabled = ref<boolean>(false);
const yamiNoteFederationTrustedInstances = ref<string>('');

async function init() {
	const meta = await misskeyApi('admin/meta');
	enableRegistration.value = !meta.disableRegistration;
	emailInquiredForSignup.value = meta.emailInquiredForSignup ?? false;
	emailRequiredForSignup.value = meta.emailRequiredForSignup;
	approvalRequiredForSignup.value = meta.approvalRequiredForSignup;
	ugcVisibilityForVisitor.value = meta.ugcVisibilityForVisitor;
	sensitiveWords.value = meta.sensitiveWords.join('\n');
	prohibitedWords.value = meta.prohibitedWords.join('\n');
	prohibitedWordsForNameOfUser.value = meta.prohibitedWordsForNameOfUser.join('\n');
	hiddenTags.value = meta.hiddenTags.join('\n');
	preservedUsernames.value = meta.preservedUsernames.join('\n');
	blockedHosts.value = meta.blockedHosts.join('\n');
	silencedHosts.value = meta.silencedHosts?.join('\n') ?? '';
	mediaSilencedHosts.value = meta.mediaSilencedHosts.join('\n');
	yamiNoteFederationEnabled.value = meta.yamiNoteFederationEnabled || false;
	yamiNoteFederationTrustedInstances.value = Array.isArray(meta.yamiNoteFederationTrustedInstances)
		? meta.yamiNoteFederationTrustedInstances.join('\n')
		: '';
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

function onChange_emailInquiredForSignup(value: boolean) {
	emailInquiredForSignup.value = value;

	// If email is not inquired, it can't be required
	if (!value) {
		emailRequiredForSignup.value = false;
	}

	os.apiWithDialog('admin/update-meta', {
		emailInquiredForSignup: value,
		emailRequiredForSignup: emailRequiredForSignup.value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_emailRequiredForSignup(value: boolean) {
	// This only works if email is inquired
	if (!emailInquiredForSignup.value) {
		return;
	}

	os.apiWithDialog('admin/update-meta', {
		emailRequiredForSignup: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_approvalRequiredForSignup(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		approvalRequiredForSignup: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_ugcVisibilityForVisitor(value: string) {
	os.apiWithDialog('admin/update-meta', {
		ugcVisibilityForVisitor: value,
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

function onChange_yamiNoteFederationEnabled(value: boolean) {
	yamiNoteFederationEnabled.value = value;

	os.apiWithDialog('admin/update-meta', {
		yamiNoteFederationEnabled: value,
		yamiNoteFederationTrustedInstances: value
			? yamiNoteFederationTrustedInstances.value.split('\n').map(x => x.trim()).filter(x => x)
			: [],
	}).then(() => {
		fetchInstance(true);
	});
}

function save_yamiNoteFederationTrustedInstances() {
	const cleanedInstances = yamiNoteFederationTrustedInstances.value.split('\n').map(x => x.trim()).filter(x => x);

	os.apiWithDialog('admin/update-meta', {
		yamiNoteFederationTrustedInstances: cleanedInstances,
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.moderation,
	icon: 'ti ti-shield',
}));
</script>
