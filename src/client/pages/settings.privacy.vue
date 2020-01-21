<template>
<section class="mk-settings-page-privacy _section">
	<div class="_title"><fa :icon="faLock"/> {{ $t('privacy') }}</div>
	<div class="_content">
		<mk-switch v-model="isLocked" @change="save()">{{ $t('makeFollowManuallyApprove') }}</mk-switch>
		<mk-select v-model="defaultNoteVisibility">
			<template #label>{{ $t('defaultNoteVisibility') }}</template>
			<option value="public">{{ $t('_visibility.public') }}</option>
			<option value="followers">{{ $t('_visibility.followers') }}</option>
			<option value="specified">{{ $t('_visibility.specified') }}</option>
		</mk-select>
		<mk-switch v-model="rememberNoteVisibility" @change="save()">{{ $t('rememberNoteVisibility') }}</mk-switch>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import MkSelect from '../components/ui/select.vue';
import MkSwitch from '../components/ui/switch.vue';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	components: {
		MkSelect,
		MkSwitch,
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
