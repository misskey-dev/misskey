<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model="useObjectStorage">{{ $ts.useObjectStorage }}</FormSwitch>

		<template v-if="useObjectStorage">
			<FormInput v-model="objectStorageBaseUrl">
				<span>{{ $ts.objectStorageBaseUrl }}</span>
				<template #desc>{{ $ts.objectStorageBaseUrlDesc }}</template>
			</FormInput>

			<FormInput v-model="objectStorageBucket">
				<span>{{ $ts.objectStorageBucket }}</span>
				<template #desc>{{ $ts.objectStorageBucketDesc }}</template>
			</FormInput>

			<FormInput v-model="objectStoragePrefix">
				<span>{{ $ts.objectStoragePrefix }}</span>
				<template #desc>{{ $ts.objectStoragePrefixDesc }}</template>
			</FormInput>

			<FormInput v-model="objectStorageEndpoint">
				<span>{{ $ts.objectStorageEndpoint }}</span>
				<template #desc>{{ $ts.objectStorageEndpointDesc }}</template>
			</FormInput>

			<FormInput v-model="objectStorageRegion">
				<span>{{ $ts.objectStorageRegion }}</span>
				<template #desc>{{ $ts.objectStorageRegionDesc }}</template>
			</FormInput>

			<FormInput v-model="objectStorageAccessKey">
				<template #prefix><i class="fas fa-key"></i></template>
				<span>Access key</span>
			</FormInput>

			<FormInput v-model="objectStorageSecretKey">
				<template #prefix><i class="fas fa-key"></i></template>
				<span>Secret key</span>
			</FormInput>

			<FormSwitch v-model="objectStorageUseSSL">
				{{ $ts.objectStorageUseSSL }}
				<template #desc>{{ $ts.objectStorageUseSSLDesc }}</template>
			</FormSwitch>

			<FormSwitch v-model="objectStorageUseProxy">
				{{ $ts.objectStorageUseProxy }}
				<template #desc>{{ $ts.objectStorageUseProxyDesc }}</template>
			</FormSwitch>

			<FormSwitch v-model="objectStorageSetPublicRead">
				{{ $ts.objectStorageSetPublicRead }}
			</FormSwitch>

			<FormSwitch v-model="objectStorageS3ForcePathStyle">
				s3ForcePathStyle
			</FormSwitch>
		</template>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/debobigego/switch.vue';
import FormInput from '@client/components/debobigego/input.vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import FormSuspense from '@client/components/debobigego/suspense.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { fetchInstance } from '@client/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormBase,
		FormGroup,
		FormButton,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.objectStorage,
				icon: 'fas fa-cloud',
				bg: 'var(--bg)',
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

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
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
