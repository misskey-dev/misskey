<template>
<FormBase>
	<div class="_formItem">
		<div class="_formLabel">{{ $t('reactionSettingDescription') }}</div>
		<div class="_formPanel">
			<XDraggable class="zoaiodol" v-model="reactions" :item-key="item => item" animation="150" delay="100" delay-on-touch-only="true">
				<template #item="{element}">
					<button class="_button item" @click="remove(element, $event)">
						<MkEmoji :emoji="element" :normal="true"/>
					</button>
				</template>
				<template #footer>
					<button class="_button add" @click="chooseEmoji"><Fa :icon="faPlus"/></button>
				</template>
			</XDraggable>
		</div>
		<div class="_formCaption">{{ $t('reactionSettingDescription2') }} <button class="_textButton" @click="preview">{{ $t('preview') }}</button></div>
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
import { faUndo, faPlus } from '@fortawesome/free-solid-svg-icons';
import XDraggable from 'vuedraggable';
import FormInput from '@/components/form/input.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormButton from '@/components/form/button.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		FormInput,
		FormButton,
		FormBase,
		FormRadios,
		XDraggable,
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
			reactions: JSON.parse(JSON.stringify(this.$pizzax.state.reactions)),
			faLaugh, faSave, faEye, faUndo, faPlus
		}
	},

	computed: {
		reactionPickerWidth: defaultStore.makeGetterSetter('reactionPickerWidth'),
		reactionPickerHeight: defaultStore.makeGetterSetter('reactionPickerHeight'),
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
			this.$pizzax.set('reactions', this.reactions);
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

			this.reactions = JSON.parse(JSON.stringify(this.$pizzax.def.reactions.default));
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

	> .add {
		display: inline-block;
		padding: 8px;
	}
}
</style>
