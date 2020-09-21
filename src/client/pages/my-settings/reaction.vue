<template>
<section class="_card">
	<div class="_title"><Fa :icon="faLaugh"/> {{ $t('reaction') }}</div>
	<div class="_content">
		<MkInput v-model:value="reactions" style="font-family: 'Segoe UI Emoji', 'Noto Color Emoji', Roboto, HelveticaNeue, Arial, sans-serif">
			{{ $t('reaction') }}<template #desc>{{ $t('reactionSettingDescription') }} <button class="_textButton" @click="chooseEmoji">{{ $t('chooseEmoji') }}</button></template>
		</MkInput>
		<MkButton inline @click="setDefault"><Fa :icon="faUndo"/> {{ $t('default') }}</MkButton>
	</div>
	<div class="_footer">
		<MkButton @click="save()" primary inline :disabled="!changed"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		<MkButton inline @click="preview"><Fa :icon="faEye"/> {{ $t('preview') }}</MkButton>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLaugh, faSave, faEye } from '@fortawesome/free-regular-svg-icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import MkInput from '@/components/ui/input.vue';
import MkButton from '@/components/ui/button.vue';
import { emojiRegexWithCustom } from '../../../misc/emoji-regex';
import { defaultSettings } from '../../store';
import * as os from '@/os';

export default defineComponent({
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

	computed: {
		splited(): any {
			return this.reactions.match(emojiRegexWithCustom);
		},
	},

	watch: {
		reactions() {
			this.changed = true;
		}
	},

	methods: {
		save() {
			this.$store.dispatch('settings/set', { key: 'reactions', value: this.splited });
			this.changed = false;
		},

		async preview(ev) {
			os.modal(await import('@/components/reaction-picker.vue'), {
				reactions: this.splited,
				showFocus: false,
			}, {}, {
				source: ev.currentTarget || ev.target,
			});
		},

		setDefault() {
			this.reactions = defaultSettings.reactions.join('');
		},

		async chooseEmoji(ev) {
			os.modal(await import('@/components/emoji-picker.vue'), {}, {}, {
				source: ev.currentTarget || ev.target
			}).then(emoji => {
				if (emoji == null) return;
				this.reactions += emoji;
			});
		}
	}
});
</script>
