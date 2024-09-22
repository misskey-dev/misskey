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
					<MkFolder :defaultOpen="true">
						<template #icon><i class="ti ti-info-circle"></i></template>
						<template #label>{{ i18n.ts.info }}</template>
						<template #footer>
							<MkButton primary rounded @click="saveInfo">{{ i18n.ts.save }}</MkButton>
						</template>

						<div class="_gaps">
							<MkInput v-model="name">
								<template #label>{{ i18n.ts.instanceName }}</template>
							</MkInput>

							<MkInput v-model="shortName">
								<template #label>{{ i18n.ts._serverSettings.shortName }} ({{ i18n.ts.optional }})</template>
								<template #caption>{{ i18n.ts._serverSettings.shortNameDescription }}</template>
							</MkInput>

							<MkTextarea v-model="description">
								<template #label>{{ i18n.ts.instanceDescription }}</template>
							</MkTextarea>

							<FormSplit :minWidth="300">
								<MkInput v-model="maintainerName">
									<template #label>{{ i18n.ts.maintainerName }}</template>
								</MkInput>

								<MkInput v-model="maintainerEmail" type="email">
									<template #prefix><i class="ti ti-mail"></i></template>
									<template #label>{{ i18n.ts.maintainerEmail }}</template>
								</MkInput>
							</FormSplit>

							<MkInput v-model="tosUrl" type="url">
								<template #prefix><i class="ti ti-link"></i></template>
								<template #label>{{ i18n.ts.tosUrl }}</template>
							</MkInput>

							<MkInput v-model="privacyPolicyUrl" type="url">
								<template #prefix><i class="ti ti-link"></i></template>
								<template #label>{{ i18n.ts.privacyPolicyUrl }}</template>
							</MkInput>

							<MkInput v-model="inquiryUrl" type="url">
								<template #prefix><i class="ti ti-link"></i></template>
								<template #label>{{ i18n.ts._serverSettings.inquiryUrl }}</template>
								<template #caption>{{ i18n.ts._serverSettings.inquiryUrlDescription }}</template>
							</MkInput>

							<MkInput v-model="repositoryUrl" type="url">
								<template #label>{{ i18n.ts.repositoryUrl }}</template>
								<template #prefix><i class="ti ti-link"></i></template>
								<template #caption>{{ i18n.ts.repositoryUrlDescription }}</template>
							</MkInput>

							<MkInfo v-if="!instance.providesTarball && !repositoryUrl" warn>
								{{ i18n.ts.repositoryUrlOrTarballRequired }}
							</MkInfo>

							<MkInput v-model="impressumUrl" type="url">
								<template #label>{{ i18n.ts.impressumUrl }}</template>
								<template #prefix><i class="ti ti-link"></i></template>
								<template #caption>{{ i18n.ts.impressumDescription }}</template>
							</MkInput>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-user-star"></i></template>
						<template #label>{{ i18n.ts.pinnedUsers }}</template>
						<template #footer>
							<MkButton primary rounded @click="save_pinnedUsers">{{ i18n.ts.save }}</MkButton>
						</template>

						<MkTextarea v-model="pinnedUsers">
							<template #label>{{ i18n.ts.pinnedUsers }}</template>
							<template #caption>{{ i18n.ts.pinnedUsersDescription }}</template>
						</MkTextarea>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-cloud"></i></template>
						<template #label>{{ i18n.ts.files }}</template>
						<template #footer>
							<MkButton primary rounded @click="saveFiles">{{ i18n.ts.save }}</MkButton>
						</template>

						<div class="_gaps">
							<MkSwitch v-model="cacheRemoteFiles">
								<template #label>{{ i18n.ts.cacheRemoteFiles }}</template>
								<template #caption>{{ i18n.ts.cacheRemoteFilesDescription }}{{ i18n.ts.youCanCleanRemoteFilesCache }}</template>
							</MkSwitch>

							<template v-if="cacheRemoteFiles">
								<MkSwitch v-model="cacheRemoteSensitiveFiles">
									<template #label>{{ i18n.ts.cacheRemoteSensitiveFiles }}</template>
									<template #caption>{{ i18n.ts.cacheRemoteSensitiveFilesDescription }}</template>
								</MkSwitch>
							</template>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-world-cog"></i></template>
						<template #label>ServiceWorker</template>
						<template #footer>
							<MkButton primary rounded @click="saveServiceWorker">{{ i18n.ts.save }}</MkButton>
						</template>

						<div class="_gaps">
							<MkSwitch v-model="enableServiceWorker">
								<template #label>{{ i18n.ts.enableServiceworker }}</template>
								<template #caption>{{ i18n.ts.serviceworkerInfo }}</template>
							</MkSwitch>

							<template v-if="enableServiceWorker">
								<MkInput v-model="swPublicKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Public key</template>
								</MkInput>

								<MkInput v-model="swPrivateKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Private key</template>
								</MkInput>
							</template>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-ad"></i></template>
						<template #label>{{ i18n.ts._ad.adsSettings }}</template>
						<template #footer>
							<MkButton primary rounded @click="saveAd">{{ i18n.ts.save }}</MkButton>
						</template>

						<div class="_gaps">
							<div class="_gaps_s">
								<MkInput v-model="notesPerOneAd" :min="0" type="number">
									<template #label>{{ i18n.ts._ad.notesPerOneAd }}</template>
									<template #caption>{{ i18n.ts._ad.setZeroToDisable }}</template>
								</MkInput>
								<MkInfo v-if="notesPerOneAd > 0 && notesPerOneAd < 20" :warn="true">
									{{ i18n.ts._ad.adsTooClose }}
								</MkInfo>
							</div>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-world-search"></i></template>
						<template #label>{{ i18n.ts._urlPreviewSetting.title }}</template>
						<template #footer>
							<MkButton primary rounded @click="saveUrlPreview">{{ i18n.ts.save }}</MkButton>
						</template>

						<div class="_gaps">
							<MkSwitch v-model="urlPreviewEnabled">
								<template #label>{{ i18n.ts._urlPreviewSetting.enable }}</template>
							</MkSwitch>

							<MkSwitch v-model="urlPreviewRequireContentLength">
								<template #label>{{ i18n.ts._urlPreviewSetting.requireContentLength }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.requireContentLengthDescription }}</template>
							</MkSwitch>

							<MkInput v-model="urlPreviewMaximumContentLength" type="number">
								<template #label>{{ i18n.ts._urlPreviewSetting.maximumContentLength }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.maximumContentLengthDescription }}</template>
							</MkInput>

							<MkInput v-model="urlPreviewTimeout" type="number">
								<template #label>{{ i18n.ts._urlPreviewSetting.timeout }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.timeoutDescription }}</template>
							</MkInput>

							<MkInput v-model="urlPreviewUserAgent" type="text">
								<template #label>{{ i18n.ts._urlPreviewSetting.userAgent }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.userAgentDescription }}</template>
							</MkInput>

							<div>
								<MkInput v-model="urlPreviewSummaryProxyUrl" type="text">
									<template #label>{{ i18n.ts._urlPreviewSetting.summaryProxy }}</template>
									<template #caption>[{{ i18n.ts.notUsePleaseLeaveBlank }}] {{ i18n.ts._urlPreviewSetting.summaryProxyDescription }}</template>
								</MkInput>

								<div :class="$style.subCaption">
									{{ i18n.ts._urlPreviewSetting.summaryProxyDescription2 }}
									<ul style="padding-left: 20px; margin: 4px 0">
										<li>{{ i18n.ts._urlPreviewSetting.timeout }} / key:timeout</li>
										<li>{{ i18n.ts._urlPreviewSetting.maximumContentLength }} / key:contentLengthLimit</li>
										<li>{{ i18n.ts._urlPreviewSetting.requireContentLength }} / key:contentLengthRequired</li>
										<li>{{ i18n.ts._urlPreviewSetting.userAgent }} / key:userAgent</li>
									</ul>
								</div>
							</div>
						</div>
					</MkFolder>

					<MkFolder>
						<template #icon><i class="ti ti-ghost"></i></template>
						<template #label>{{ i18n.ts.proxyAccount }}</template>

						<div class="_gaps">
							<MkInfo>{{ i18n.ts.proxyAccountDescription }}</MkInfo>
							<MkKeyValue>
								<template #key>{{ i18n.ts.proxyAccount }}</template>
								<template #value>{{ proxyAccount ? `@${proxyAccount.username}` : i18n.ts.none }}</template>
							</MkKeyValue>

							<MkButton primary @click="chooseProxyAccount">{{ i18n.ts.selectAccount }}</MkButton>
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
import * as Misskey from 'misskey-js';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInfo from '@/components/MkInfo.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';

const proxyAccount = ref<Misskey.entities.UserDetailed | null>(null);

const name = ref<string | null>(null);
const shortName = ref<string | null>(null);
const description = ref<string | null>(null);
const maintainerName = ref<string | null>(null);
const maintainerEmail = ref<string | null>(null);
const tosUrl = ref<string | null>(null);
const privacyPolicyUrl = ref<string | null>(null);
const inquiryUrl = ref<string | null>(null);
const repositoryUrl = ref<string | null>(null);
const impressumUrl = ref<string | null>(null);
const pinnedUsers = ref<string>('');
const cacheRemoteFiles = ref<boolean>(false);
const cacheRemoteSensitiveFiles = ref<boolean>(false);
const enableServiceWorker = ref<boolean>(false);
const swPublicKey = ref<string | null>(null);
const swPrivateKey = ref<string | null>(null);
const notesPerOneAd = ref<number>(0);
const urlPreviewEnabled = ref<boolean>(true);
const urlPreviewTimeout = ref<number>(10000);
const urlPreviewMaximumContentLength = ref<number>(1024 * 1024 * 10);
const urlPreviewRequireContentLength = ref<boolean>(true);
const urlPreviewUserAgent = ref<string | null>(null);
const urlPreviewSummaryProxyUrl = ref<string | null>(null);
const proxyAccountId = ref<string | null>(null);

async function init(): Promise<void> {
	const meta = await misskeyApi('admin/meta');
	name.value = meta.name;
	shortName.value = meta.shortName;
	description.value = meta.description;
	maintainerName.value = meta.maintainerName;
	maintainerEmail.value = meta.maintainerEmail;
	tosUrl.value = meta.tosUrl;
	privacyPolicyUrl.value = meta.privacyPolicyUrl;
	inquiryUrl.value = meta.inquiryUrl;
	repositoryUrl.value = meta.repositoryUrl;
	impressumUrl.value = meta.impressumUrl;
	pinnedUsers.value = meta.pinnedUsers.join('\n');
	cacheRemoteFiles.value = meta.cacheRemoteFiles;
	cacheRemoteSensitiveFiles.value = meta.cacheRemoteSensitiveFiles;
	enableServiceWorker.value = meta.enableServiceWorker;
	swPublicKey.value = meta.swPublickey;
	swPrivateKey.value = meta.swPrivateKey;
	notesPerOneAd.value = meta.notesPerOneAd;
	urlPreviewEnabled.value = meta.urlPreviewEnabled;
	urlPreviewTimeout.value = meta.urlPreviewTimeout;
	urlPreviewMaximumContentLength.value = meta.urlPreviewMaximumContentLength;
	urlPreviewRequireContentLength.value = meta.urlPreviewRequireContentLength;
	urlPreviewUserAgent.value = meta.urlPreviewUserAgent;
	urlPreviewSummaryProxyUrl.value = meta.urlPreviewSummaryProxyUrl;
	proxyAccountId.value = meta.proxyAccountId;
	if (proxyAccountId.value) {
		proxyAccount.value = await misskeyApi('users/show', { userId: proxyAccountId.value });
	}
}

function saveInfo() {
	os.apiWithDialog('admin/update-meta', {
		name: name.value,
		shortName: shortName.value === '' ? null : shortName.value,
		description: description.value,
		maintainerName: maintainerName.value,
		maintainerEmail: maintainerEmail.value,
		tosUrl: tosUrl.value,
		privacyPolicyUrl: privacyPolicyUrl.value,
		inquiryUrl: inquiryUrl.value,
		repositoryUrl: repositoryUrl.value,
		impressumUrl: impressumUrl.value,
	}).then(() => {
		fetchInstance(true);
	});
}

function save_pinnedUsers() {
	os.apiWithDialog('admin/update-meta', {
		pinnedUsers: pinnedUsers.value.split('\n'),
	}).then(() => {
		fetchInstance(true);
	});
}

function saveFiles() {
	os.apiWithDialog('admin/update-meta', {
		cacheRemoteFiles: cacheRemoteFiles.value,
		cacheRemoteSensitiveFiles: cacheRemoteSensitiveFiles.value,
	}).then(() => {
		fetchInstance(true);
	});
}

function saveServiceWorker() {
	os.apiWithDialog('admin/update-meta', {
		enableServiceWorker: enableServiceWorker.value,
		swPublicKey: swPublicKey.value,
		swPrivateKey: swPrivateKey.value,
	}).then(() => {
		fetchInstance(true);
	});
}

function saveAd() {
	os.apiWithDialog('admin/update-meta', {
		notesPerOneAd: notesPerOneAd.value,
	}).then(() => {
		fetchInstance(true);
	});
}

function saveUrlPreview() {
	os.apiWithDialog('admin/update-meta', {
		urlPreviewEnabled: urlPreviewEnabled.value,
		urlPreviewTimeout: urlPreviewTimeout.value,
		urlPreviewMaximumContentLength: urlPreviewMaximumContentLength.value,
		urlPreviewRequireContentLength: urlPreviewRequireContentLength.value,
		urlPreviewUserAgent: urlPreviewUserAgent.value,
		urlPreviewSummaryProxyUrl: urlPreviewSummaryProxyUrl.value,
	}).then(() => {
		fetchInstance(true);
	});
}

function chooseProxyAccount() {
	os.selectUser({ localOnly: true }).then(user => {
		proxyAccount.value = user;
		proxyAccountId.value = user.id;
		saveProxyAccount();
	});
}

function saveProxyAccount() {
	os.apiWithDialog('admin/update-meta', {
		proxyAccountId: proxyAccountId.value,
	}).then(() => {
		fetchInstance(true);
	});
}

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.general,
	icon: 'ti ti-settings',
}));
</script>

<style lang="scss" module>
.subCaption {
	font-size: 0.85em;
	color: var(--fgTransparentWeak);
}
</style>
