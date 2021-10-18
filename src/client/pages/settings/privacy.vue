<template>
<FormBase>
	<FormGroup>
		<FormSwitch v-model="isLocked" @update:modelValue="save()">{{ $ts.makeFollowManuallyApprove }}</FormSwitch>
		<FormSwitch v-model="autoAcceptFollowed" :disabled="!isLocked" @update:modelValue="save()">{{ $ts.autoAcceptFollowed }}</FormSwitch>
		<template #caption>{{ $ts.lockedAccountInfo }}</template>
	</FormGroup>
	<FormSwitch v-model="publicReactions" @update:modelValue="save()">
		{{ $ts.makeReactionsPublic }}
		<template #desc>{{ $ts.makeReactionsPublicDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="hideOnlineStatus" @update:modelValue="save()">
		{{ $ts.hideOnlineStatus }}
		<template #desc>{{ $ts.hideOnlineStatusDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="noCrawle" @update:modelValue="save()">
		{{ $ts.noCrawle }}
		<template #desc>{{ $ts.noCrawleDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="isExplorable" @update:modelValue="save()">
		{{ $ts.makeExplorable }}
		<template #desc>{{ $ts.makeExplorableDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model="rememberNoteVisibility" @update:modelValue="save()">{{ $ts.rememberNoteVisibility }}</FormSwitch>
	<FormGroup v-if="!rememberNoteVisibility">
		<template #label>{{ $ts.defaultNoteVisibility }}</template>
		<FormSelect v-model="defaultNoteVisibility">
			<option value="public">{{ $ts._visibility.public }}</option>
			<option value="home">{{ $ts._visibility.home }}</option>
			<option value="followers">{{ $ts._visibility.followers }}</option>
			<option value="specified">{{ $ts._visibility.specified }}</option>
		</FormSelect>
		<FormSwitch v-model="defaultNoteLocalOnly">{{ $ts._visibility.localOnly }}</FormSwitch>
	</FormGroup>
	<FormSwitch v-model="keepCw" @update:modelValue="save()">{{ $ts.keepCw }}</FormSwitch>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/debobigego/switch.vue';
import FormSelect from '@client/components/debobigego/select.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import * as os from '@client/os';
import { defaultStore } from '@client/store';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
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
			});
		}
	}
});
</script>
