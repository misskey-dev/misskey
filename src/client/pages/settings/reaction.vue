<template>
<div class="_section">
	<div class="_card">
		<div class="_title"><Fa :icon="faLaugh"/> {{ $t('reaction') }}</div>
		<div class="_content">
			<MkInput v-model:value="reactions" style="font-family: 'Segoe UI Emoji', 'Noto Color Emoji', Roboto, HelveticaNeue, Arial, sans-serif">
				{{ $t('reaction') }}<template #desc>{{ $t('reactionSettingDescription') }} <button class="_textButton" @click="chooseEmoji">{{ $t('chooseEmoji') }}</button></template>
			</MkInput>
			<MkButton inline @click="setDefault"><Fa :icon="faUndo"/> {{ $t('default') }}</MkButton>
			<MkSwitch v-model:value="useFullReactionPicker">{{ $t('useFullReactionPicker') }}</MkSwitch>
		</div>
		<div class="_footer">
			<MkButton @click="save()" primary inline :disabled="!changed"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
			<MkButton inline @click="preview"><Fa :icon="faEye"/> {{ $t('preview') }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLaugh, faSave, faEye } from '@fortawesome/free-regular-svg-icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import MkInput from '@/components/ui/input.vue';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import { emojiRegexWithCustom } from '../../../misc/emoji-regex';
import { defaultSettings } from '@/store';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkInput,
		MkButton,
		MkSwitch,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('reaction'),
				icon: faLaugh
			},
			reactions: this.$store.state.settings.reactions.join(''),
			changed: false,
			faLaugh, faSave, faEye, faUndo
		}
	},

	computed: {
		splited(): any {
			return this.reactions.match(emojiRegexWithCustom);
		},

		useFullReactionPicker: {
			get() { return this.$store.state.device.useFullReactionPicker; },
			set(value) { this.$store.commit('device/set', { key: 'useFullReactionPicker', value: value }); }
		},
	},

	watch: {
		reactions: {
			handler() {
				this.changed = true;
			},
			deep: true
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		save() {
			this.$store.dispatch('settings/set', { key: 'reactions', value: this.splited });
			this.changed = false;
		},

		preview(ev) {
			if (this.$store.state.device.useFullReactionPicker) {
				os.popup(import('@/components/emoji-picker.vue'), {
					overridePinned: this.splited,
					src: ev.currentTarget || ev.target,
				}, {}, 'closed');
			} else {
				os.popup(import('@/components/reaction-picker.vue'), {
					reactions: this.splited,
					showFocus: false,
					src: ev.currentTarget || ev.target,
				}, {}, 'closed');
			}
		},

		setDefault() {
			this.reactions = defaultSettings.reactions.join('');
		},

		chooseEmoji(ev) {
			os.pickEmoji(ev.currentTarget || ev.target).then(emoji => {
				this.reactions += emoji;
			});
		}
	}
});
</script>
