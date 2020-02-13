<template>
<section class="_card">
	<div class="_title"><fa :icon="faLaugh"/> {{ $t('reaction') }}</div>
	<div class="_content">
		<mk-textarea v-model="reactions">{{ $t('reaction') }}<template #desc>{{ $t('reactionSettingDescription') }}</template></mk-textarea>
	</div>
	<div class="_footer">
		<mk-button @click="save()" primary inline :disabled="!changed"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		<mk-button inline @click="preview"><fa :icon="faEye"/> {{ $t('preview') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLaugh, faSave, faEye } from '@fortawesome/free-regular-svg-icons';
import MkTextarea from '../../components/ui/textarea.vue';
import MkButton from '../../components/ui/button.vue';
import MkReactionPicker from '../../components/reaction-picker.vue';
import i18n from '../../i18n';

export default Vue.extend({
	i18n,

	components: {
		MkTextarea,
		MkButton,
	},
	
	data() {
		return {
			reactions: this.$store.state.settings.reactions.join('\n'),
			changed: false,
			faLaugh, faSave, faEye
		}
	},

	watch: {
		reactions() {
			this.changed = true;
		}
	},

	methods: {
		save() {
			this.$store.dispatch('settings/set', { key: 'reactions', value: this.reactions.trim().split('\n') });
			this.changed = false;
		},

		preview(ev) {
			const picker = this.$root.new(MkReactionPicker, {
				source: ev.currentTarget || ev.target,
				reactions: this.reactions.trim().split('\n'),
				showFocus: false,
			});
			picker.$once('chosen', reaction => {
				picker.close();
			});
		}
	}
});
</script>
