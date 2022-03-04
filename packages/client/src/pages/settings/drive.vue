<template>
<div class="_formRoot">
	<FormSection v-if="!fetching">
		<template #label>{{ $ts.usageAmount }}</template>
		<div class="_formBlock uawsfosz">
			<div class="meter"><div :style="meterStyle"></div></div>
		</div>
		<FormSplit>
			<MkKeyValue class="_formBlock">
				<template #key>{{ $ts.capacity }}</template>
				<template #value>{{ bytes(capacity, 1) }}</template>
			</MkKeyValue>
			<MkKeyValue class="_formBlock">
				<template #key>{{ $ts.inUse }}</template>
				<template #value>{{ bytes(usage, 1) }}</template>
			</MkKeyValue>
		</FormSplit>
	</FormSection>

	<FormSection>
		<template #label>{{ $ts.statistics }}</template>
		<MkChart src="per-user-drive" :args="{ user: $i }" span="day" :limit="7 * 5" :bar="true" :stacked="true" :detailed="false" :aspect-ratio="6"/>
	</FormSection>

	<FormSection>
		<FormLink @click="chooseUploadFolder()">
			{{ $ts.uploadFolder }}
			<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
			<template #suffixIcon><i class="fas fa-folder-open"></i></template>
		</FormLink>
		<FormSwitch v-model="keepOriginalUploading" class="_formBlock">{{ $ts.keepOriginalUploading }}<template #caption>{{ $ts.keepOriginalUploadingDescription }}</template></FormSwitch>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tinycolor from 'tinycolor2';
import FormLink from '@/components/form/link.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/key-value.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os';
import bytes from '@/filters/bytes';
import * as symbols from '@/symbols';
import { defaultStore } from '@/store';
import MkChart from '@/components/chart.vue';

export default defineComponent({
	components: {
		FormLink,
		FormSwitch,
		FormSection,
		MkKeyValue,
		FormSplit,
		MkChart,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.drive,
				icon: 'fas fa-cloud',
				bg: 'var(--bg)',
			},
			fetching: true,
			usage: null,
			capacity: null,
			uploadFolder: null,
		}
	},

	computed: {
		meterStyle(): any {
			return {
				width: `${this.usage / this.capacity * 100}%`,
				background: tinycolor({
					h: 180 - (this.usage / this.capacity * 180),
					s: 0.7,
					l: 0.5
				})
			};
		},
		keepOriginalUploading: defaultStore.makeGetterSetter('keepOriginalUploading'),
	},

	async created() {
		os.api('drive').then(info => {
			this.capacity = info.capacity;
			this.usage = info.usage;
			this.fetching = false;
			this.$nextTick(() => {
				this.renderChart();
			});
		});

		if (this.$store.state.uploadFolder) {
			this.uploadFolder = await os.api('drive/folders/show', {
				folderId: this.$store.state.uploadFolder
			});
		}
	},

	methods: {
		chooseUploadFolder() {
			os.selectDriveFolder(false).then(async folder => {
				this.$store.set('uploadFolder', folder ? folder.id : null);
				os.success();
				if (this.$store.state.uploadFolder) {
					this.uploadFolder = await os.api('drive/folders/show', {
						folderId: this.$store.state.uploadFolder
					});
				} else {
					this.uploadFolder = null;
				}
			});
		},

		bytes
	}
});
</script>

<style lang="scss" scoped>

@use "sass:math";

.uawsfosz {

	> .meter {
		$size: 12px;
		background: rgba(0, 0, 0, 0.1);
		border-radius: math.div($size, 2);
		overflow: hidden;

		> div {
			height: $size;
			border-radius: math.div($size, 2);
		}
	}
}
</style>
