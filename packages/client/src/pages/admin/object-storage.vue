<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<div class="_formRoot">
			<FormSwitch v-model="useObjectStorage" class="_formBlock">{{ $ts.useObjectStorage }}</FormSwitch>

			<template v-if="useObjectStorage">
				<FormInput v-model="objectStorageBaseUrl" class="_formBlock">
					<template #label>{{ $ts.objectStorageBaseUrl }}</template>
					<template #caption>{{ $ts.objectStorageBaseUrlDesc }}</template>
				</FormInput>

				<FormInput v-model="objectStorageBucket" class="_formBlock">
					<template #label>{{ $ts.objectStorageBucket }}</template>
					<template #caption>{{ $ts.objectStorageBucketDesc }}</template>
				</FormInput>

				<FormInput v-model="objectStoragePrefix" class="_formBlock">
					<template #label>{{ $ts.objectStoragePrefix }}</template>
					<template #caption>{{ $ts.objectStoragePrefixDesc }}</template>
				</FormInput>

				<FormInput v-model="objectStorageEndpoint" class="_formBlock">
					<template #label>{{ $ts.objectStorageEndpoint }}</template>
					<template #caption>{{ $ts.objectStorageEndpointDesc }}</template>
				</FormInput>

				<FormInput v-model="objectStorageRegion" class="_formBlock">
					<template #label>{{ $ts.objectStorageRegion }}</template>
					<template #caption>{{ $ts.objectStorageRegionDesc }}</template>
				</FormInput>

				<FormSplit :min-width="280">
					<FormInput v-model="objectStorageAccessKey" class="_formBlock">
						<template #prefix><i class="fas fa-key"></i></template>
						<template #label>Access key</template>
					</FormInput>

					<FormInput v-model="objectStorageSecretKey" class="_formBlock">
						<template #prefix><i class="fas fa-key"></i></template>
						<template #label>Secret key</template>
					</FormInput>
				</FormSplit>

				<FormSwitch v-model="objectStorageUseSSL" class="_formBlock">
					<template #label>{{ $ts.objectStorageUseSSL }}</template>
					<template #caption>{{ $ts.objectStorageUseSSLDesc }}</template>
				</FormSwitch>

				<FormSwitch v-model="objectStorageUseProxy" class="_formBlock">
					<template #label>{{ $ts.objectStorageUseProxy }}</template>
					<template #caption>{{ $ts.objectStorageUseProxyDesc }}</template>
				</FormSwitch>

				<FormSwitch v-model="objectStorageSetPublicRead" class="_formBlock">
					<template #label>{{ $ts.objectStorageSetPublicRead }}</template>
				</FormSwitch>

				<FormSwitch v-model="objectStorageS3ForcePathStyle" class="_formBlock">
					<template #label>s3ForcePathStyle</template>
				</FormSwitch>
			</template>
		</div>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormGroup from '@/components/form/group.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormGroup,
		FormSuspense,
		FormSplit,
		FormSection,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.objectStorage,
				icon: 'fas fa-cloud',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-check',
					text: this.$ts.save,
					handler: this.save,
				}],
			},
			useObjectStorage: false,
			objectStorageBaseUrl: null,
			objectStorageBucket: null,
			objectStoragePrefix: null,
			objectStorageEndpoint: null,
			objectStorageRegion: null,
			objectStoragePort: null,
			objectStorageAccessKey: null,
			objectStorageSecretKey: null,
			objectStorageUseSSL: false,
			objectStorageUseProxy: false,
			objectStorageSetPublicRead: false,
			objectStorageS3ForcePathStyle: true,
		}
	},

	methods: {
		async init() {
			const meta = await os.api('admin/meta');
			this.useObjectStorage = meta.useObjectStorage;
			this.objectStorageBaseUrl = meta.objectStorageBaseUrl;
			this.objectStorageBucket = meta.objectStorageBucket;
			this.objectStoragePrefix = meta.objectStoragePrefix;
			this.objectStorageEndpoint = meta.objectStorageEndpoint;
			this.objectStorageRegion = meta.objectStorageRegion;
			this.objectStoragePort = meta.objectStoragePort;
			this.objectStorageAccessKey = meta.objectStorageAccessKey;
			this.objectStorageSecretKey = meta.objectStorageSecretKey;
			this.objectStorageUseSSL = meta.objectStorageUseSSL;
			this.objectStorageUseProxy = meta.objectStorageUseProxy;
			this.objectStorageSetPublicRead = meta.objectStorageSetPublicRead;
			this.objectStorageS3ForcePathStyle = meta.objectStorageS3ForcePathStyle;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				useObjectStorage: this.useObjectStorage,
				objectStorageBaseUrl: this.objectStorageBaseUrl ? this.objectStorageBaseUrl : null,
				objectStorageBucket: this.objectStorageBucket ? this.objectStorageBucket : null,
				objectStoragePrefix: this.objectStoragePrefix ? this.objectStoragePrefix : null,
				objectStorageEndpoint: this.objectStorageEndpoint ? this.objectStorageEndpoint : null,
				objectStorageRegion: this.objectStorageRegion ? this.objectStorageRegion : null,
				objectStoragePort: this.objectStoragePort ? this.objectStoragePort : null,
				objectStorageAccessKey: this.objectStorageAccessKey ? this.objectStorageAccessKey : null,
				objectStorageSecretKey: this.objectStorageSecretKey ? this.objectStorageSecretKey : null,
				objectStorageUseSSL: this.objectStorageUseSSL,
				objectStorageUseProxy: this.objectStorageUseProxy,
				objectStorageSetPublicRead: this.objectStorageSetPublicRead,
				objectStorageS3ForcePathStyle: this.objectStorageS3ForcePathStyle,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
