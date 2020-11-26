<template>
<FormBase>
	<div class="_formItem">
		<div class="_formLabel">{{ $t('reactionSettingDescription') }}</div>
		<div class="_formPanel">
			<XDraggable class="zoaiodol" :list="reactions" animation="150" delay="100" delay-on-touch-only="true">
				<button class="_button item" v-for="reaction in reactions" :key="reaction" @click="remove(reaction, $event)">
					<MkEmoji :emoji="reaction" :normal="true"/>
				</button>
				<template #footer>
					<button>a</button>
				</template>
			</XDraggable>
		</div>
		<div class="_formCaption">{{ $t('reactionSettingDescription2') }} <button class="_textButton" @click="chooseEmoji">{{ $t('chooseEmoji') }}</button></div>
	</div>

	<FormRadios v-model="reactionPickerWidth">
		<template #desc>{{ $t('width') }}</template>
		<option :value="1">{{ $t('small') }}</option>
		<option :value="2">{{ $t('medium') }}</option>
		<option :value="3">{{ $t('large') }}</option>
	</FormRadios>
	<FormRadios v-model="reactionPickerHeight">
		<template #desc>{{ $t('height') }}</template>
		<option :value="1">{{ $t('small') }}</option>
		<option :value="2">{{ $t('medium') }}</option>
		<option :value="3">{{ $t('large') }}</option>
	</FormRadios>
	<FormButton @click="preview"><Fa :icon="faEye"/> {{ $t('preview') }}</FormButton>
	<FormButton danger @click="setDefault"><Fa :icon="faUndo"/> {{ $t('default') }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLaugh, faSave, faEye } from '@fortawesome/free-regular-svg-icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { VueDraggableNext } from 'vue-draggable-next';
import FormInput from '@/components/form/input.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormButton from '@/components/form/button.vue';
import { defaultSettings } from '@/store';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormInput,
		FormButton,
		FormBase,
		FormRadios,
		XDraggable: VueDraggableNext,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('reaction'),
				icon: faLaugh,
				action: {
					icon: faEye,
					handler: this.preview
				}
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
	padding: 16px;

	> .item {
		display: inline-block;
		padding: 8px;
		cursor: move;
	}
}
</style>
