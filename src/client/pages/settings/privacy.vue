<template>
<FormBase>
	<FormGroup>
		<FormSwitch v-model:value="isLocked" @update:value="save()">{{ $ts.makeFollowManuallyApprove }}</FormSwitch>
		<FormSwitch v-model:value="autoAcceptFollowed" :disabled="!isLocked" @update:value="save()">{{ $ts.autoAcceptFollowed }}</FormSwitch>
		<template #caption>{{ $ts.lockedAccountInfo }}</template>
	</FormGroup>
	<FormSwitch v-model:value="hideOnlineStatus" @update:value="save()">
		{{ $ts.hideOnlineStatus }}
		<template #desc>{{ $ts.hideOnlineStatusDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model:value="noCrawle" @update:value="save()">
		{{ $ts.noCrawle }}
		<template #desc>{{ $ts.noCrawleDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model:value="isExplorable" @update:value="save()">
		{{ $ts.makeExplorable }}
		<template #desc>{{ $ts.makeExplorableDescription }}</template>
	</FormSwitch>
	<FormSwitch v-model:value="rememberNoteVisibility" @update:value="save()">{{ $ts.rememberNoteVisibility }}</FormSwitch>
	<FormGroup v-if="!rememberNoteVisibility">
		<template #label>{{ $ts.defaultNoteVisibility }}</template>
		<FormSelect v-model:value="defaultNoteVisibility">
			<option value="public">{{ $ts._visibility.public }}</option>
			<option value="home">{{ $ts._visibility.home }}</option>
			<option value="followers">{{ $ts._visibility.followers }}</option>
			<option value="specified">{{ $ts._visibility.specified }}</option>
		</FormSelect>
		<FormSwitch v-model:value="defaultNoteLocalOnly">{{ $ts._visibility.localOnly }}</FormSwitch>
	</FormGroup>
	<FormSwitch v-model:value="keepCw" @update:value="save()">{{ $ts.keepCw }}</FormSwitch>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormSelect from '@client/components/form/select.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
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
				icon: 'fas fa-lock-open'
			},
			isLocked: false,
			autoAcceptFollowed: false,
			noCrawle: false,
			isExplorable: false,
			hideOnlineStatus: false,
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
			});
		}
	}
});
</script>
