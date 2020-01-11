<template>
<section class="mk-settings-page-reaction _section">
	<div class="title"><fa :icon="faLaugh"/> {{ $t('reaction') }}</div>
	<div class="content">
		<x-textarea v-model="reactions" style="margin-top: 16px;">
			{{ $t('reaction') }}<template #desc>{{ $t('reactionSettingDescription') }}</template>
		</x-textarea>
	</div>
	<div class="footer">
		<x-button @click="save()" primary inline :disabled="!changed"><fa :icon="faSave"/> {{ $t('save') }}</x-button>
		<x-button ref="previewButton" inline @click="preview()"><fa :icon="faEye"/> {{ $t('preview') }}</x-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLaugh, faSave, faEye } from '@fortawesome/free-regular-svg-icons';
import XTextarea from '../components/ui/textarea.vue';
import XButton from '../components/ui/button.vue';
import MkReactionPicker from '../components/reaction-picker.vue';
import i18n from '../i18n';

export default Vue.extend({
	i18n,

	components: {
		XTextarea,
		XButton,
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

		preview() {
			const picker = this.$root.new(MkReactionPicker, {
				source: this.$refs.previewButton.$el,
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
