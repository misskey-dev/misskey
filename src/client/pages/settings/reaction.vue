<template>
<div class="_section">
	<div class="_card">
		<div class="_title"><Fa :icon="faLaugh"/> {{ $t('reaction') }}</div>
		<div class="_content">
			<div class="_caption" style="padding: 0 8px 8px 8px;">{{ $t('reactionSettingDescription') }}</div>
			<XDraggable class="zoaiodol" :list="reactions" animation="150" delay="100" delay-on-touch-only="true">
				<button class="_button item" v-for="reaction in reactions" :key="reaction" @click="remove(reaction, $event)">
					<MkEmoji :emoji="reaction" :normal="true"/>
				</button>
				<template #footer>
					<button>a</button>
				</template>
			</XDraggable>
			<div class="_caption" style="padding: 8px;">{{ $t('reactionSettingDescription2') }} <button class="_textButton" @click="chooseEmoji">{{ $t('chooseEmoji') }}</button></div>
			<MkRadios v-model="reactionPickerWidth">
				<template #desc>{{ $t('width') }}</template>
				<option :value="1">{{ $t('small') }}</option>
				<option :value="2">{{ $t('medium') }}</option>
				<option :value="3">{{ $t('large') }}</option>
			</MkRadios>
			<MkRadios v-model="reactionPickerHeight">
				<template #desc>{{ $t('height') }}</template>
				<option :value="1">{{ $t('small') }}</option>
				<option :value="2">{{ $t('medium') }}</option>
				<option :value="3">{{ $t('large') }}</option>
			</MkRadios>
		</div>
		<div class="_footer">
			<MkButton inline @click="preview"><Fa :icon="faEye"/> {{ $t('preview') }}</MkButton>
			<MkButton inline @click="setDefault"><Fa :icon="faUndo"/> {{ $t('default') }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLaugh, faSave, faEye } from '@fortawesome/free-regular-svg-icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { VueDraggableNext } from 'vue-draggable-next';
import MkInput from '@/components/ui/input.vue';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkRadios from '@/components/ui/radios.vue';
import { emojiRegexWithCustom } from '../../../misc/emoji-regex';
import { defaultSettings } from '@/store';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkInput,
		MkButton,
		MkSwitch,
		MkRadios,
		XDraggable: VueDraggableNext,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('reaction'),
				icon: faLaugh
			},
			reactions: JSON.parse(JSON.stringify(this.$store.state.settings.reactions)),
			faLaugh, faSave, faEye, faUndo
		}
	},

	computed: {
		useFullReactionPicker: {
			get() { return this.$store.state.device.useFullReactionPicker; },
			set(value) { this.$store.commit('device/set', { key: 'useFullReactionPicker', value: value }); }
		},
		reactionPickerWidth: {
			get() { return this.$store.state.device.reactionPickerWidth; },
			set(value) { this.$store.commit('device/set', { key: 'reactionPickerWidth', value: value }); }
		},
		reactionPickerHeight: {
			get() { return this.$store.state.device.reactionPickerHeight; },
			set(value) { this.$store.commit('device/set', { key: 'reactionPickerHeight', value: value }); }
		},
	},

	watch: {
		reactions: {
			handler() {
				this.save();
			},
			deep: true
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		save() {
			this.$store.dispatch('settings/set', { key: 'reactions', value: this.reactions });
		},

		remove(reaction, ev) {
			os.modalMenu([{
				text: this.$t('remove'),
				action: () => {
					this.reactions = this.reactions.filter(x => x !== reaction)
				}
			}], ev.currentTarget || ev.target);
		},

		preview(ev) {
			os.popup(import('@/components/emoji-picker.vue'), {
				asReactionPicker: true,
				src: ev.currentTarget || ev.target,
			}, {}, 'closed');
		},

		async setDefault() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('resetAreYouSure'),
				showCancelButton: true
			});
			if (canceled) return;

			this.reactions = JSON.parse(JSON.stringify(defaultSettings.reactions));
		},

		chooseEmoji(ev) {
			os.pickEmoji(ev.currentTarget || ev.target, {
				showPinned: false
			}).then(emoji => {
				if (!this.reactions.includes(emoji)) {
					this.reactions.push(emoji);
				}
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.zoaiodol {
	border: solid 1px var(--divider);
	border-radius: var(--radius);
	padding: 16px;

	> .item {
		display: inline-block;
		padding: 8px;
		cursor: move;
	}
}
</style>
