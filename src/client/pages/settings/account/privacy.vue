<template>
<div class="_section">
	<div class="_card">
		<div class="_title"><Fa :icon="faLock"/> {{ $t('privacy') }}</div>
		<div class="_content">
			<MkSwitch v-model:value="isLocked" @update:value="save()">{{ $t('makeFollowManuallyApprove') }}</MkSwitch>
			<MkSwitch v-model:value="autoAcceptFollowed" v-if="isLocked" @update:value="save()">{{ $t('autoAcceptFollowed') }}</MkSwitch>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="rememberNoteVisibility" @update:value="save()">{{ $t('rememberNoteVisibility') }}</MkSwitch>
			<MkSelect v-model:value="defaultNoteVisibility" style="margin-bottom: 8px;" v-if="!rememberNoteVisibility">
				<template #label>{{ $t('defaultNoteVisibility') }}</template>
				<option value="public">{{ $t('_visibility.public') }}</option>
				<option value="home">{{ $t('_visibility.home') }}</option>
				<option value="followers">{{ $t('_visibility.followers') }}</option>
				<option value="specified">{{ $t('_visibility.specified') }}</option>
			</MkSelect>
			<MkSwitch v-model:value="defaultNoteLocalOnly" v-if="!rememberNoteVisibility">{{ $t('_visibility.localOnly') }}</MkSwitch>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import MkSelect from '@/components/ui/select.vue';
import MkSwitch from '@/components/ui/switch.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkSelect,
		MkSwitch,
	},
	
	data() {
		return {
			isLocked: false,
			autoAcceptFollowed: false,
			faLock
		}
	},

	computed: {
		defaultNoteVisibility: {
			get() { return this.$store.state.settings.defaultNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'defaultNoteVisibility', value }); }
		},

		defaultNoteLocalOnly: {
			get() { return this.$store.state.settings.defaultNoteLocalOnly; },
			set(value) { this.$store.dispatch('settings/set', { key: 'defaultNoteLocalOnly', value }); }
		},

		rememberNoteVisibility: {
			get() { return this.$store.state.settings.rememberNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'rememberNoteVisibility', value }); }
		},
	},

	created() {
		this.isLocked = this.$store.state.i.isLocked;
		this.autoAcceptFollowed = this.$store.state.i.autoAcceptFollowed;
	},

	methods: {
		save() {
			os.api('i/update', {
				isLocked: !!this.isLocked,
				autoAcceptFollowed: !!this.autoAcceptFollowed,
			});
		}
	}
});
</script>
