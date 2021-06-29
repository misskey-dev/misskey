<template>
<FormBase>
	<FormSuspense :p="init">
		<FormInput v-model:value="name">
			<span>{{ $ts.instanceName }}</span>
		</FormInput>

		<FormTextarea v-model:value="description">
			<span>{{ $ts.instanceDescription }}</span>
		</FormTextarea>

		<FormInput v-model:value="iconUrl">
			<template #prefix><i class="fas fa-link"></i></template>
			<span>{{ $ts.iconUrl }}</span>
		</FormInput>

		<FormInput v-model:value="bannerUrl">
			<template #prefix><i class="fas fa-link"></i></template>
			<span>{{ $ts.bannerUrl }}</span>
		</FormInput>

		<FormInput v-model:value="backgroundImageUrl">
			<template #prefix><i class="fas fa-link"></i></template>
			<span>{{ $ts.backgroundImageUrl }}</span>
		</FormInput>

		<FormInput v-model:value="tosUrl">
			<template #prefix><i class="fas fa-link"></i></template>
			<span>{{ $ts.tosUrl }}</span>
		</FormInput>

		<FormInput v-model:value="maintainerName">
			<span>{{ $ts.maintainerName }}</span>
		</FormInput>

		<FormInput v-model:value="maintainerEmail" type="email">
			<template #prefix><i class="fas fa-envelope"></i></template>
			<span>{{ $ts.maintainerEmail }}</span>
		</FormInput>

		<FormInput v-model:value="maxNoteTextLength" type="number">
			<template #prefix><i class="fas fa-pencil-alt"></i></template>
			<span>{{ $ts.maxNoteTextLength }}</span>
		</FormInput>

		<FormSwitch v-model:value="enableLocalTimeline">{{ $ts.enableLocalTimeline }}</FormSwitch>
		<FormSwitch v-model:value="enableGlobalTimeline">{{ $ts.enableGlobalTimeline }}</FormSwitch>
		<FormInfo>{{ $ts.disablingTimelinesInfo }}</FormInfo>

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
import FormTextarea from '@client/components/form/textarea.vue';
import FormInfo from '@client/components/form/info.vue';
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
		FormTextarea,
		FormInfo,
		FormSuspense,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.general,
				icon: 'fas fa-cog'
			},
			name: null,
			description: null,
			tosUrl: null as string | null,
			maintainerName: null,
			maintainerEmail: null,
			iconUrl: null,
			bannerUrl: null,
			backgroundImageUrl: null,
			maxNoteTextLength: 0,
			enableLocalTimeline: false,
			enableGlobalTimeline: false,
		}
	},

	async mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async init() {
			const meta = await os.api('meta', { detail: true });
			this.name = meta.name;
			this.description = meta.description;
			this.tosUrl = meta.tosUrl;
			this.iconUrl = meta.iconUrl;
			this.bannerUrl = meta.bannerUrl;
			this.backgroundImageUrl = meta.backgroundImageUrl;
			this.maintainerName = meta.maintainerName;
			this.maintainerEmail = meta.maintainerEmail;
			this.maxNoteTextLength = meta.maxNoteTextLength;
			this.enableLocalTimeline = !meta.disableLocalTimeline;
			this.enableGlobalTimeline = !meta.disableGlobalTimeline;
		},

		save() {
			os.apiWithDialog('admin/update-meta', {
				name: this.name,
				description: this.description,
				tosUrl: this.tosUrl,
				iconUrl: this.iconUrl,
				bannerUrl: this.bannerUrl,
				backgroundImageUrl: this.backgroundImageUrl,
				maintainerName: this.maintainerName,
				maintainerEmail: this.maintainerEmail,
				maxNoteTextLength: this.maxNoteTextLength,
				disableLocalTimeline: !this.enableLocalTimeline,
				disableGlobalTimeline: !this.enableGlobalTimeline,
			}).then(() => {
				fetchInstance();
			});
		}
	}
});
</script>
