<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<FormSuspense :p="init">
				<div class="_gaps_m">
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

					<MkInput v-model="impressumUrl" type="url">
						<template #label>{{ i18n.ts.impressumUrl }}</template>
						<template #prefix><i class="ti ti-link"></i></template>
						<template #caption>{{ i18n.ts.impressumDescription }}</template>
					</MkInput>

					<MkTextarea v-model="pinnedUsers">
						<template #label>{{ i18n.ts.pinnedUsers }}</template>
						<template #caption>{{ i18n.ts.pinnedUsersDescription }}</template>
					</MkTextarea>

					<FormSection>
						<template #label>{{ i18n.ts.files }}</template>

						<div class="_gaps_m">
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
					</FormSection>

					<FormSection>
						<template #label>ServiceWorker</template>

						<div class="_gaps_m">
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
					</FormSection>

					<FormSection>
						<template #label>Misskey® Fan-out Timeline Technology™ (FTT)</template>

						<div class="_gaps_m">
							<MkSwitch v-model="enableFanoutTimeline">
								<template #label>{{ i18n.ts.enable }}</template>
								<template #caption>{{ i18n.ts._serverSettings.fanoutTimelineDescription }}</template>
							</MkSwitch>

							<MkInput v-model="perLocalUserUserTimelineCacheMax" type="number">
								<template #label>perLocalUserUserTimelineCacheMax</template>
							</MkInput>

							<MkInput v-model="perRemoteUserUserTimelineCacheMax" type="number">
								<template #label>perRemoteUserUserTimelineCacheMax</template>
							</MkInput>

							<MkInput v-model="perUserHomeTimelineCacheMax" type="number">
								<template #label>perUserHomeTimelineCacheMax</template>
							</MkInput>

							<MkInput v-model="perUserListTimelineCacheMax" type="number">
								<template #label>perUserListTimelineCacheMax</template>
							</MkInput>
						</div>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts._ad.adsSettings }}</template>

						<div class="_gaps_m">
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
					</FormSection>
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
import { } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInfo from '@/components/MkInfo.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';

let name: string | null = $ref(null);
let shortName: string | null = $ref(null);
let description: string | null = $ref(null);
let maintainerName: string | null = $ref(null);
let maintainerEmail: string | null = $ref(null);
let impressumUrl: string | null = $ref(null);
let pinnedUsers: string = $ref('');
let cacheRemoteFiles: boolean = $ref(false);
let cacheRemoteSensitiveFiles: boolean = $ref(false);
let enableServiceWorker: boolean = $ref(false);
let swPublicKey: any = $ref(null);
let swPrivateKey: any = $ref(null);
let enableFanoutTimeline: boolean = $ref(false);
let perLocalUserUserTimelineCacheMax: number = $ref(0);
let perRemoteUserUserTimelineCacheMax: number = $ref(0);
let perUserHomeTimelineCacheMax: number = $ref(0);
let perUserListTimelineCacheMax: number = $ref(0);
let notesPerOneAd: number = $ref(0);

async function init(): Promise<void> {
	const meta = await os.api('admin/meta');
	name = meta.name;
	shortName = meta.shortName;
	description = meta.description;
	maintainerName = meta.maintainerName;
	maintainerEmail = meta.maintainerEmail;
	impressumUrl = meta.impressumUrl;
	pinnedUsers = meta.pinnedUsers.join('\n');
	cacheRemoteFiles = meta.cacheRemoteFiles;
	cacheRemoteSensitiveFiles = meta.cacheRemoteSensitiveFiles;
	enableServiceWorker = meta.enableServiceWorker;
	swPublicKey = meta.swPublickey;
	swPrivateKey = meta.swPrivateKey;
	enableFanoutTimeline = meta.enableFanoutTimeline;
	perLocalUserUserTimelineCacheMax = meta.perLocalUserUserTimelineCacheMax;
	perRemoteUserUserTimelineCacheMax = meta.perRemoteUserUserTimelineCacheMax;
	perUserHomeTimelineCacheMax = meta.perUserHomeTimelineCacheMax;
	perUserListTimelineCacheMax = meta.perUserListTimelineCacheMax;
	notesPerOneAd = meta.notesPerOneAd;
}

async function save(): void {
	await os.apiWithDialog('admin/update-meta', {
		name,
		shortName: shortName === '' ? null : shortName,
		description,
		maintainerName,
		maintainerEmail,
		impressumUrl,
		pinnedUsers: pinnedUsers.split('\n'),
		cacheRemoteFiles,
		cacheRemoteSensitiveFiles,
		enableServiceWorker,
		swPublicKey,
		swPrivateKey,
		enableFanoutTimeline,
		perLocalUserUserTimelineCacheMax,
		perRemoteUserUserTimelineCacheMax,
		perUserHomeTimelineCacheMax,
		perUserListTimelineCacheMax,
		notesPerOneAd,
	});

	fetchInstance();
}

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.general,
	icon: 'ti ti-settings',
});
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
