<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<div class="_formRoot">
				<FormSwitch v-model="useObjectStorage" class="_formBlock">{{ i18n.ts.useObjectStorage }}</FormSwitch>

				<template v-if="useObjectStorage">
					<FormInput v-model="objectStorageBaseUrl" class="_formBlock">
						<template #label>{{ i18n.ts.objectStorageBaseUrl }}</template>
						<template #caption>{{ i18n.ts.objectStorageBaseUrlDesc }}</template>
					</FormInput>

					<FormInput v-model="objectStorageBucket" class="_formBlock">
						<template #label>{{ i18n.ts.objectStorageBucket }}</template>
						<template #caption>{{ i18n.ts.objectStorageBucketDesc }}</template>
					</FormInput>

					<FormInput v-model="objectStoragePrefix" class="_formBlock">
						<template #label>{{ i18n.ts.objectStoragePrefix }}</template>
						<template #caption>{{ i18n.ts.objectStoragePrefixDesc }}</template>
					</FormInput>

					<FormInput v-model="objectStorageEndpoint" class="_formBlock">
						<template #label>{{ i18n.ts.objectStorageEndpoint }}</template>
						<template #caption>{{ i18n.ts.objectStorageEndpointDesc }}</template>
					</FormInput>

					<FormInput v-model="objectStorageRegion" class="_formBlock">
						<template #label>{{ i18n.ts.objectStorageRegion }}</template>
						<template #caption>{{ i18n.ts.objectStorageRegionDesc }}</template>
					</FormInput>

					<FormSplit :min-width="280">
						<FormInput v-model="objectStorageAccessKey" class="_formBlock">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>Access key</template>
						</FormInput>

						<FormInput v-model="objectStorageSecretKey" class="_formBlock">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>Secret key</template>
						</FormInput>
					</FormSplit>

					<FormSwitch v-model="objectStorageUseSSL" class="_formBlock">
						<template #label>{{ i18n.ts.objectStorageUseSSL }}</template>
						<template #caption>{{ i18n.ts.objectStorageUseSSLDesc }}</template>
					</FormSwitch>

					<FormSwitch v-model="objectStorageUseProxy" class="_formBlock">
						<template #label>{{ i18n.ts.objectStorageUseProxy }}</template>
						<template #caption>{{ i18n.ts.objectStorageUseProxyDesc }}</template>
					</FormSwitch>

					<FormSwitch v-model="objectStorageSetPublicRead" class="_formBlock">
						<template #label>{{ i18n.ts.objectStorageSetPublicRead }}</template>
					</FormSwitch>

					<FormSwitch v-model="objectStorageS3ForcePathStyle" class="_formBlock">
						<template #label>s3ForcePathStyle</template>
					</FormSwitch>
				</template>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let useObjectStorage: boolean = $ref(false);
let objectStorageBaseUrl: string | null = $ref(null);
let objectStorageBucket: string | null = $ref(null);
let objectStoragePrefix: string | null = $ref(null);
let objectStorageEndpoint: string | null = $ref(null);
let objectStorageRegion: string | null = $ref(null);
let objectStoragePort: number | null = $ref(null);
let objectStorageAccessKey: string | null = $ref(null);
let objectStorageSecretKey: string | null = $ref(null);
let objectStorageUseSSL: boolean = $ref(false);
let objectStorageUseProxy: boolean = $ref(false);
let objectStorageSetPublicRead: boolean = $ref(false);
let objectStorageS3ForcePathStyle: boolean = $ref(true);

async function init() {
	const meta = await os.api('admin/meta');
	useObjectStorage = meta.useObjectStorage;
	objectStorageBaseUrl = meta.objectStorageBaseUrl;
	objectStorageBucket = meta.objectStorageBucket;
	objectStoragePrefix = meta.objectStoragePrefix;
	objectStorageEndpoint = meta.objectStorageEndpoint;
	objectStorageRegion = meta.objectStorageRegion;
	objectStoragePort = meta.objectStoragePort;
	objectStorageAccessKey = meta.objectStorageAccessKey;
	objectStorageSecretKey = meta.objectStorageSecretKey;
	objectStorageUseSSL = meta.objectStorageUseSSL;
	objectStorageUseProxy = meta.objectStorageUseProxy;
	objectStorageSetPublicRead = meta.objectStorageSetPublicRead;
	objectStorageS3ForcePathStyle = meta.objectStorageS3ForcePathStyle;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		useObjectStorage,
		objectStorageBaseUrl,
		objectStorageBucket,
		objectStoragePrefix,
		objectStorageEndpoint,
		objectStorageRegion,
		objectStoragePort,
		objectStorageAccessKey,
		objectStorageSecretKey,
		objectStorageUseSSL,
		objectStorageUseProxy,
		objectStorageSetPublicRead,
		objectStorageS3ForcePathStyle,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-check',
	text: i18n.ts.save,
	handler: save,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.objectStorage,
	icon: 'ti ti-cloud',
});
</script>
