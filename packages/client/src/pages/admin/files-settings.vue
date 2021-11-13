<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model="cacheRemoteFiles">
			{{ $ts.cacheRemoteFiles }}
			<template #desc>{{ $ts.cacheRemoteFilesDescription }}</template>
		</FormSwitch>

		<FormSwitch v-model="proxyRemoteFiles">
			{{ $ts.proxyRemoteFiles }}
			<template #desc>{{ $ts.proxyRemoteFilesDescription }}</template>
		</FormSwitch>

		<FormInput v-model="localDriveCapacityMb" type="number">
			<span>{{ $ts.driveCapacityPerLocalAccount }}</span>
			<template #suffix>MB</template>
			<template #desc>{{ $ts.inMb }}</template>
		</FormInput>

		<FormInput v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles">
			<span>{{ $ts.driveCapacityPerRemoteAccount }}</span>
			<template #suffix>MB</template>
			<template #desc>{{ $ts.inMb }}</template>
		</FormInput>

		<FormButton @click="save" primary><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormSuspense>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormInput from '@/components/debobigego/input.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormSuspense from '@/components/debobigego/suspense.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

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
				title: this.$ts.files,
				icon: 'fas fa-cloud',
				bg: 'var(--bg)',
			},
			cacheRemoteFiles: false,
			proxyRemoteFiles: false,
			localDriveCapacityMb: 0,
			remoteDriveCapacityMb: 0,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.cacheRemoteFiles = meta.cacheRemoteFiles;
			this.proxyRemoteFiles = meta.proxyRemoteFiles;
			this.localDriveCapacityMb = meta.driveCapacityPerLocalUserMb;
			this.remoteDriveCapacityMb = meta.driveCapacityPerRemoteUserMb;
		},
		save() {
			os.apiWithDialog('admin/update-meta', {
				cacheRemoteFiles: this.cacheRemoteFiles,
				proxyRemoteFiles: this.proxyRemoteFiles,
				localDriveCapacityMb: parseInt(this.localDriveCapacityMb, 10),
				remoteDriveCapacityMb: parseInt(this.remoteDriveCapacityMb, 10),
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
