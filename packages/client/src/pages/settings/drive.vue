<template>
<FormBase class="">
	<FormGroup v-if="!fetching">
		<template #label>{{ $ts.usageAmount }}</template>
		<div class="_debobigegoItem uawsfosz">
			<div class="_debobigegoPanel">
				<div class="meter"><div :style="meterStyle"></div></div>
			</div>
		</div>
		<FormKeyValueView>
			<template #key>{{ $ts.capacity }}</template>
			<template #value>{{ bytes(capacity, 1) }}</template>
		</FormKeyValueView>
		<FormKeyValueView>
			<template #key>{{ $ts.inUse }}</template>
			<template #value>{{ bytes(usage, 1) }}</template>
		</FormKeyValueView>
	</FormGroup>

	<div class="_debobigegoItem">
		<div class="_debobigegoLabel">{{ $ts.statistics }}</div>
		<div class="_debobigegoPanel">
			<div ref="chart"></div>
		</div>
	</div>

	<FormButton :center="false" primary @click="chooseUploadFolder()">
		{{ $ts.uploadFolder }}
		<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
		<template #suffixIcon><i class="fas fa-folder-open"></i></template>
	</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tinycolor from 'tinycolor2';
import FormButton from '@/components/debobigego/button.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import FormBase from '@/components/debobigego/base.vue';
import * as os from '@/os';
import bytes from '@/filters/bytes';
import * as symbols from '@/symbols';

// TODO: render chart

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormGroup,
		FormKeyValueView,
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
		}
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

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
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
	> div {
		padding: 24px;

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
}
</style>
