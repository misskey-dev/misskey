<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<div class="_gaps_m">
				<MkSwitch v-model="useObjectStorage">{{ i18n.ts.useObjectStorage }}</MkSwitch>

				<template v-if="useObjectStorage">
					<MkInput v-model="objectStorageBaseUrl" :placeholder="'https://example.com'" type="url">
						<template #label>{{ i18n.ts.objectStorageBaseUrl }}</template>
						<template #caption>{{ i18n.ts.objectStorageBaseUrlDesc }}</template>
					</MkInput>

					<MkInput v-model="objectStorageBucket">
						<template #label>{{ i18n.ts.objectStorageBucket }}</template>
						<template #caption>{{ i18n.ts.objectStorageBucketDesc }}</template>
					</MkInput>

					<MkInput v-model="objectStoragePrefix">
						<template #label>{{ i18n.ts.objectStoragePrefix }}</template>
						<template #caption>{{ i18n.ts.objectStoragePrefixDesc }}</template>
					</MkInput>

					<MkInput v-model="objectStorageEndpoint" :placeholder="'example.com'">
						<template #label>{{ i18n.ts.objectStorageEndpoint }}</template>
						<template #prefix>https://</template>
						<template #caption>{{ i18n.ts.objectStorageEndpointDesc }}</template>
					</MkInput>

					<MkInput v-model="objectStorageRegion">
						<template #label>{{ i18n.ts.objectStorageRegion }}</template>
						<template #caption>{{ i18n.ts.objectStorageRegionDesc }}</template>
					</MkInput>

					<FormSplit :minWidth="280">
						<MkInput v-model="objectStorageAccessKey">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>Access key</template>
						</MkInput>

						<MkInput v-model="objectStorageSecretKey" type="password">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>Secret key</template>
						</MkInput>
					</FormSplit>

					<MkSwitch v-model="objectStorageUseSSL">
						<template #label>{{ i18n.ts.objectStorageUseSSL }}</template>
						<template #caption>{{ i18n.ts.objectStorageUseSSLDesc }}</template>
					</MkSwitch>

					<MkSwitch v-model="objectStorageUseProxy">
						<template #label>{{ i18n.ts.objectStorageUseProxy }}</template>
						<template #caption>{{ i18n.ts.objectStorageUseProxyDesc }}</template>
					</MkSwitch>

					<MkSwitch v-model="objectStorageSetPublicRead">
						<template #label>{{ i18n.ts.objectStorageSetPublicRead }}</template>
					</MkSwitch>

					<MkSwitch v-model="objectStorageS3ForcePathStyle">
						<template #label>s3ForcePathStyle</template>
						<template #caption>{{ i18n.ts.s3ForcePathStyleDesc }}</template>
					</MkSwitch>
				</template>
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
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';

const useObjectStorage = ref<boolean>(false);
const objectStorageBaseUrl = ref<string | null>(null);
const objectStorageBucket = ref<string | null>(null);
const objectStoragePrefix = ref<string | null>(null);
const objectStorageEndpoint = ref<string | null>(null);
const objectStorageRegion = ref<string | null>(null);
const objectStoragePort = ref<number | null>(null);
const objectStorageAccessKey = ref<string | null>(null);
const objectStorageSecretKey = ref<string | null>(null);
const objectStorageUseSSL = ref<boolean>(false);
const objectStorageUseProxy = ref<boolean>(false);
const objectStorageSetPublicRead = ref<boolean>(false);
const objectStorageS3ForcePathStyle = ref<boolean>(true);

async function init() {
	const meta = await os.api('admin/meta');
	useObjectStorage.value = meta.useObjectStorage;
	objectStorageBaseUrl.value = meta.objectStorageBaseUrl;
	objectStorageBucket.value = meta.objectStorageBucket;
	objectStoragePrefix.value = meta.objectStoragePrefix;
	objectStorageEndpoint.value = meta.objectStorageEndpoint;
	objectStorageRegion.value = meta.objectStorageRegion;
	objectStoragePort.value = meta.objectStoragePort;
	objectStorageAccessKey.value = meta.objectStorageAccessKey;
	objectStorageSecretKey.value = meta.objectStorageSecretKey;
	objectStorageUseSSL.value = meta.objectStorageUseSSL;
	objectStorageUseProxy.value = meta.objectStorageUseProxy;
	objectStorageSetPublicRead.value = meta.objectStorageSetPublicRead;
	objectStorageS3ForcePathStyle.value = meta.objectStorageS3ForcePathStyle;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		useObjectStorage: useObjectStorage.value,
		objectStorageBaseUrl: objectStorageBaseUrl.value,
		objectStorageBucket: objectStorageBucket.value,
		objectStoragePrefix: objectStoragePrefix.value,
		objectStorageEndpoint: objectStorageEndpoint.value,
		objectStorageRegion: objectStorageRegion.value,
		objectStoragePort: objectStoragePort.value,
		objectStorageAccessKey: objectStorageAccessKey.value,
		objectStorageSecretKey: objectStorageSecretKey.value,
		objectStorageUseSSL: objectStorageUseSSL.value,
		objectStorageUseProxy: objectStorageUseProxy.value,
		objectStorageSetPublicRead: objectStorageSetPublicRead.value,
		objectStorageS3ForcePathStyle: objectStorageS3ForcePathStyle.value,
	}).then(() => {
		fetchInstance();
	});
}

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.objectStorage,
	icon: 'ti ti-cloud',
});
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
