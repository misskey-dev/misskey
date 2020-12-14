<template>
<FormBase>
	<FormGroup>
		<FormSwitch v-model:value="isLocked" @update:value="save()">{{ $t('makeFollowManuallyApprove') }}</FormSwitch>
		<FormSwitch v-model:value="autoAcceptFollowed" :disabled="!isLocked" @update:value="save()">{{ $t('autoAcceptFollowed') }}</FormSwitch>
		<template #caption>{{ $t('lockedAccountInfo') }}</template>
	</FormGroup>
	<FormSwitch v-model:value="noCrawle" @update:value="save()">
		{{ $t('noCrawle') }}
		<template #desc>{{ $t('noCrawleDescription') }}</template>
	</FormSwitch>
	<FormSwitch v-model:value="isExplorable" @update:value="save()">
		{{ $t('makeExplorable') }}
		<template #desc>{{ $t('makeExplorableDescription') }}</template>
	</FormSwitch>
	<FormSwitch v-model:value="rememberNoteVisibility" @update:value="save()">{{ $t('rememberNoteVisibility') }}</FormSwitch>
	<FormGroup v-if="!rememberNoteVisibility">
		<template #label>{{ $t('defaultNoteVisibility') }}</template>
		<FormSelect v-model:value="defaultNoteVisibility">
			<option value="public">{{ $t('_visibility.public') }}</option>
			<option value="home">{{ $t('_visibility.home') }}</option>
			<option value="followers">{{ $t('_visibility.followers') }}</option>
			<option value="specified">{{ $t('_visibility.specified') }}</option>
		</FormSelect>
		<FormSwitch v-model:value="defaultNoteLocalOnly">{{ $t('_visibility.localOnly') }}</FormSwitch>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import * as os from '@/os';

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
			INFO: {
				title: this.$t('privacy'),
				icon: faLockOpen
			},
			isLocked: false,
			autoAcceptFollowed: false,
			noCrawle: false,
			isExplorable: false,
		}
	},

	computed: {
		defaultNoteVisibility: {
			get() { return this.$pizzax.state.defaultNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'defaultNoteVisibility', value }); }
		},

		defaultNoteLocalOnly: {
			get() { return this.$pizzax.state.defaultNoteLocalOnly; },
			set(value) { this.$store.dispatch('settings/set', { key: 'defaultNoteLocalOnly', value }); }
		},

		rememberNoteVisibility: {
			get() { return this.$pizzax.state.rememberNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'rememberNoteVisibility', value }); }
		},
	},

	created() {
		this.isLocked = this.$i.isLocked;
		this.autoAcceptFollowed = this.$i.autoAcceptFollowed;
		this.noCrawle = this.$i.noCrawle;
		this.isExplorable = this.$i.isExplorable;
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		save() {
			os.api('i/update', {
				isLocked: !!this.isLocked,
				autoAcceptFollowed: !!this.autoAcceptFollowed,
				noCrawle: !!this.noCrawle,
				isExplorable: !!this.isExplorable,
			});
		}
	}
});
</script>
