<template>
<section class="_card">
	<div class="_title"><fa :icon="faLaugh"/> {{ $t('reaction') }}</div>
	<div class="_content">
		<mk-input v-model="reactions" style="font-family: 'Segoe UI Emoji', 'Noto Color Emoji', Roboto, HelveticaNeue, Arial, sans-serif">
			{{ $t('reaction') }}<template #desc>{{ $t('reactionSettingDescription') }}</template>
		</mk-input>
	</div>
	<div class="_footer">
		<mk-button @click="save()" primary inline :disabled="!changed"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		<mk-button inline @click="preview"><fa :icon="faEye"/> {{ $t('preview') }}</mk-button>
		<mk-button inline @click="setDefault"><fa :icon="faUndo"/> {{ $t('default') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLaugh, faSave, faEye } from '@fortawesome/free-regular-svg-icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import MkInput from '../../components/ui/input.vue';
import MkButton from '../../components/ui/button.vue';
import MkReactionPicker from '../../components/reaction-picker.vue';
import i18n from '../../i18n';
import { emojiRegexWithCustom } from '../../../misc/emoji-regex';

export default Vue.extend({
	i18n,

	components: {
		MkInput,
		MkButton,
	},
	
	data() {
		return {
			reactions: this.$store.state.settings.reactions.join(''),
			changed: false,
			faLaugh, faSave, faEye, faUndo
		}
	},

	watch: {
		reactions() {
			this.changed = true;
		}
	},

	computed: {
		splited(): any {
			return this.reactions.match(emojiRegexWithCustom);
		},
	},

	methods: {
		save() {
			this.$store.dispatch('settings/set', { key: 'reactions', value: this.splited });
			this.changed = false;
		},

		preview(ev) {
			const picker = this.$root.new(MkReactionPicker, {
				source: ev.currentTarget || ev.target,
				reactions: this.splited,
				showFocus: false,
			});
			picker.$once('chosen', reaction => {
				picker.close();
			});
		},

		setDefault() {
			this.reactions = '👍❤😆🤔😮🎉💢😥😇🍮';
		},
	}
});
</script>
