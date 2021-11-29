<template>
<div class="_formRoot">
	<FormSwitch v-model="isLocked" class="_formBlock" @update:modelValue="save()">{{ $ts.makeFollowManuallyApprove }}<template #caption>{{ $ts.lockedAccountInfo }}</template></FormSwitch>
	<FormSwitch v-if="isLocked" v-model="autoAcceptFollowed" class="_formBlock" @update:modelValue="save()">{{ $ts.autoAcceptFollowed }}</FormSwitch>

	<FormSwitch v-model="publicReactions" class="_formBlock" @update:modelValue="save()">
		{{ $ts.makeReactionsPublic }}
		<template #caption>{{ $ts.makeReactionsPublicDescription }}</template>
	</FormSwitch>
		
	<FormSelect v-model="ffVisibility" class="_formBlock">
		<template #label>{{ $ts.ffVisibility }}</template>
		<option value="public">{{ $ts._ffVisibility.public }}</option>
		<option value="followers">{{ $ts._ffVisibility.followers }}</option>
		<option value="private">{{ $ts._ffVisibility.private }}</option>
		<template #caption>{{ $ts.ffVisibilityDescription }}</template>
	</FormSelect>
		
	<FormSwitch v-model="hideOnlineStatus" class="_formBlock" @update:modelValue="save()">
		{{ $ts.hideOnlineStatus }}
		<template #caption>{{ $ts.hideOnlineStatusDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="noCrawle" class="_formBlock" @update:modelValue="save()">
		{{ $ts.noCrawle }}
		<template #caption>{{ $ts.noCrawleDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="isExplorable" class="_formBlock" @update:modelValue="save()">
		{{ $ts.makeExplorable }}
		<template #caption>{{ $ts.makeExplorableDescription }}</template>
	</FormSwitch>

	<FormSection>
		<FormSwitch v-model="rememberNoteVisibility" class="_formBlock" @update:modelValue="save()">{{ $ts.rememberNoteVisibility }}</FormSwitch>
		<FormGroup v-if="!rememberNoteVisibility" class="_formBlock">
			<template #label>{{ $ts.defaultNoteVisibility }}</template>
			<FormSelect v-model="defaultNoteVisibility" class="_formBlock">
				<option value="public">{{ $ts._visibility.public }}</option>
				<option value="home">{{ $ts._visibility.home }}</option>
				<option value="followers">{{ $ts._visibility.followers }}</option>
				<option value="specified">{{ $ts._visibility.specified }}</option>
			</FormSelect>
			<FormSwitch v-model="defaultNoteLocalOnly" class="_formBlock">{{ $ts._visibility.localOnly }}</FormSwitch>
		</FormGroup>
	</FormSection>

	<FormSwitch v-model="keepCw" class="_formBlock" @update:modelValue="save()">{{ $ts.keepCw }}</FormSwitch>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormSection from '@/components/form/section.vue';
import FormGroup from '@/components/form/group.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormSelect,
		FormSection,
		FormGroup,
		FormSwitch,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.privacy,
				icon: 'fas fa-lock-open',
				bg: 'var(--bg)',
			},
			isLocked: false,
			autoAcceptFollowed: false,
			noCrawle: false,
			isExplorable: false,
			hideOnlineStatus: false,
			publicReactions: false,
			ffVisibility: 'public',
		}
	},

	computed: {
		defaultNoteVisibility: defaultStore.makeGetterSetter('defaultNoteVisibility'),
		defaultNoteLocalOnly: defaultStore.makeGetterSetter('defaultNoteLocalOnly'),
		rememberNoteVisibility: defaultStore.makeGetterSetter('rememberNoteVisibility'),
		keepCw: defaultStore.makeGetterSetter('keepCw'),
	},

	created() {
		this.isLocked = this.$i.isLocked;
		this.autoAcceptFollowed = this.$i.autoAcceptFollowed;
		this.noCrawle = this.$i.noCrawle;
		this.isExplorable = this.$i.isExplorable;
		this.hideOnlineStatus = this.$i.hideOnlineStatus;
		this.publicReactions = this.$i.publicReactions;
		this.ffVisibility = this.$i.ffVisibility;
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		save() {
			os.api('i/update', {
				isLocked: !!this.isLocked,
				autoAcceptFollowed: !!this.autoAcceptFollowed,
				noCrawle: !!this.noCrawle,
				isExplorable: !!this.isExplorable,
				hideOnlineStatus: !!this.hideOnlineStatus,
				publicReactions: !!this.publicReactions,
				ffVisibility: this.ffVisibility,
			});
		}
	}
});
</script>
