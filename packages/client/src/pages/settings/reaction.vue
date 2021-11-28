<template>
<div class="_formRoot">
	<FromSlot class="_formBlock">
		<template #label>{{ $ts.reactionSettingDescription }}</template>
		<div v-panel style="border-radius: 6px;">
			<XDraggable v-model="reactions" class="zoaiodol" :item-key="item => item" animation="150" delay="100" delay-on-touch-only="true">
				<template #item="{element}">
					<button class="_button item" @click="remove(element, $event)">
						<MkEmoji :emoji="element" :normal="true"/>
					</button>
				</template>
				<template #footer>
					<button class="_button add" @click="chooseEmoji"><i class="fas fa-plus"></i></button>
				</template>
			</XDraggable>
		</div>
		<template #caption>{{ $ts.reactionSettingDescription2 }} <button class="_textButton" @click="preview">{{ $ts.preview }}</button></template>
	</FromSlot>

	<FormRadios v-model="reactionPickerWidth" class="_formBlock">
		<template #label>{{ $ts.width }}</template>
		<option :value="1">{{ $ts.small }}</option>
		<option :value="2">{{ $ts.medium }}</option>
		<option :value="3">{{ $ts.large }}</option>
	</FormRadios>
	<FormRadios v-model="reactionPickerHeight" class="_formBlock">
		<template #label>{{ $ts.height }}</template>
		<option :value="1">{{ $ts.small }}</option>
		<option :value="2">{{ $ts.medium }}</option>
		<option :value="3">{{ $ts.large }}</option>
	</FormRadios>
	<FormSection>
		<FormButton @click="preview"><i class="fas fa-eye"></i> {{ $ts.preview }}</FormButton>
	</FormSection>
	<FormSection>
		<FormButton danger @click="setDefault"><i class="fas fa-undo"></i> {{ $ts.default }}</FormButton>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XDraggable from 'vuedraggable';
import FormInput from '@/components/form/input.vue';
import FormRadios from '@/components/form/radios.vue';
import FromSlot from '@/components/form/slot.vue';
import FormButton from '@/components/ui/button.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormInput,
		FormButton,
		FromSlot,
		FormRadios,
		FormSection,
		XDraggable,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.reaction,
				icon: 'fas fa-laugh',
				action: {
					icon: 'fas fa-eye',
					handler: this.preview
				},
				bg: 'var(--bg)',
			},
			reactions: JSON.parse(JSON.stringify(this.$store.state.reactions)),
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
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		save() {
			this.$store.set('reactions', this.reactions);
		},

		remove(reaction, ev) {
			os.popupMenu([{
				text: this.$ts.remove,
				action: () => {
					this.reactions = this.reactions.filter(x => x !== reaction)
				}
			}], ev.currentTarget || ev.target);
		},

		preview(ev) {
			os.popup(import('@/components/emoji-picker-dialog.vue'), {
				asReactionPicker: true,
				src: ev.currentTarget || ev.target,
			}, {}, 'closed');
		},

		async setDefault() {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: this.$ts.resetAreYouSure,
			});
			if (canceled) return;

			this.reactions = JSON.parse(JSON.stringify(this.$store.def.reactions.default));
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
	padding: 12px;
	font-size: 1.1em;

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
