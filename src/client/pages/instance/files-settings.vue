<template>
<FormBase>
	<FormSuspense :p="init">
		<FormSwitch v-model:value="cacheRemoteFiles">
			{{ $ts.cacheRemoteFiles }}
			<template #desc>{{ $ts.cacheRemoteFilesDescription }}</template>
		</FormSwitch>

		<FormSwitch v-model:value="proxyRemoteFiles">
			{{ $ts.proxyRemoteFiles }}
			<template #desc>{{ $ts.proxyRemoteFilesDescription }}</template>
		</FormSwitch>

		<FormInput v-model:value="localDriveCapacityMb" type="number">
			<span>{{ $ts.driveCapacityPerLocalAccount }}</span>
			<template #suffix>MB</template>
			<template #desc>{{ $ts.inMb }}</template>
		</FormInput>

		<FormInput v-model:value="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles">
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
import FormSwitch from '@client/components/form/switch.vue';
import FormInput from '@client/components/form/input.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormSuspense from '@client/components/form/suspense.vue';
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
				title: this.$ts.files,
				icon: 'fas fa-cloud'
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
