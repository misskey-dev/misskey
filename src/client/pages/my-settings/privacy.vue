<template>
<section class="_card">
	<div class="_title"><fa :icon="faLock"/> {{ $t('privacy') }}</div>
	<div class="_content">
		<mk-switch v-model="isLocked" @change="save()" v-t="'makeFollowManuallyApprove'"></mk-switch>
		<mk-switch v-model="autoAcceptFollowed" v-if="isLocked" @change="save()" v-t="'autoAcceptFollowed'"></mk-switch>
	</div>
	<div class="_content">
		<mk-switch v-model="rememberNoteVisibility" @change="save()" v-t="'rememberNoteVisibility'"></mk-switch>
		<mk-select v-model="defaultNoteVisibility" style="margin-bottom: 8px;" v-if="!rememberNoteVisibility">
			<template #label v-t="'defaultNoteVisibility'"></template>
			<option value="public" v-t="'_visibility.public'"></option>
			<option value="home" v-t="'_visibility.home'"></option>
			<option value="followers" v-t="'_visibility.followers'"></option>
			<option value="specified" v-t="'_visibility.specified'"></option>
		</mk-select>
		<mk-switch v-model="defaultNoteLocalOnly" v-if="!rememberNoteVisibility" v-t="'_visibility.localOnly'"></mk-switch>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import MkSelect from '../../components/ui/select.vue';
import MkSwitch from '../../components/ui/switch.vue';

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
			this.$root.api('i/update', {
				isLocked: !!this.isLocked,
				autoAcceptFollowed: !!this.autoAcceptFollowed,
			});
		}
	}
});
</script>
