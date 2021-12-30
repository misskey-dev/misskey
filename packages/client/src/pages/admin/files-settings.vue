<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormSuspense :p="init">
		<div class="_formRoot">
			<FormSwitch v-model="cacheRemoteFiles" class="_formBlock">
				<template #label>{{ $ts.cacheRemoteFiles }}</template>
				<template #caption>{{ $ts.cacheRemoteFilesDescription }}</template>
			</FormSwitch>

			<FormSwitch v-model="proxyRemoteFiles" class="_formBlock">
				<template #label>{{ $ts.proxyRemoteFiles }}</template>
				<template #caption>{{ $ts.proxyRemoteFilesDescription }}</template>
			</FormSwitch>

			<FormSplit :min-width="280">
				<FormInput v-model="localDriveCapacityMb" type="number" class="_formBlock">
					<template #label>{{ $ts.driveCapacityPerLocalAccount }}</template>
					<template #suffix>MB</template>
					<template #caption>{{ $ts.inMb }}</template>
				</FormInput>

				<FormInput v-model="remoteDriveCapacityMb" type="number" :disabled="!cacheRemoteFiles" class="_formBlock">
					<template #label>{{ $ts.driveCapacityPerRemoteAccount }}</template>
					<template #suffix>MB</template>
					<template #caption>{{ $ts.inMb }}</template>
				</FormInput>
			</FormSplit>
		</div>
	</FormSuspense>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormInput from '@/components/form/input.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { fetchInstance } from '@/instance';

export default defineComponent({
	components: {
		FormSwitch,
		FormInput,
		FormSplit,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.files,
				icon: 'fas fa-cloud',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-check',
					text: this.$ts.save,
					handler: this.save,
				}],
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
