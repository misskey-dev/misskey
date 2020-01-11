<template>
<section class="mk-settings-page-privacy _section">
	<div class="title"><fa :icon="faLock"/> {{ $t('privacy') }}</div>
	<div class="content">
		<x-switch v-model="isLocked" @change="save()">{{ $t('makeFollowManuallyApprove') }}</x-switch>
		<x-select v-model="defaultNoteVisibility">
			<template #label>{{ $t('defaultNoteVisibility') }}</template>
			<option value="public">{{ $t('_visibility.public') }}</option>
			<option value="followers">{{ $t('_visibility.followers') }}</option>
			<option value="specified">{{ $t('_visibility.specified') }}</option>
		</x-select>
		<x-switch v-model="rememberNoteVisibility" @change="save()">{{ $t('rememberNoteVisibility') }}</x-switch>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import XSelect from '../components/ui/select.vue';
import XSwitch from '../components/ui/switch.vue';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	components: {
		XSelect,
		XSwitch,
	},
	
	data() {
		return {
			isLocked: false,
			faLock
		}
	},

	computed: {
		defaultNoteVisibility: {
			get() { return this.$store.state.settings.defaultNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'defaultNoteVisibility', value }); }
		},

		rememberNoteVisibility: {
			get() { return this.$store.state.settings.rememberNoteVisibility; },
			set(value) { this.$store.dispatch('settings/set', { key: 'rememberNoteVisibility', value }); }
		},
	},

	created() {
		this.isLocked = this.$store.state.i.isLocked;
	},

	methods: {
		save() {
			this.$root.api('i/update', {
				isLocked: !!this.isLocked,
			});
		}
	}
});
</script>

<style lang="scss" scoped>

</style>
