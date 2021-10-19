<template>
<FormBase>
	<div class="_debobigegoItem">
		<div class="_debobigegoLabel">{{ $ts.reactionSettingDescription }}</div>
		<div class="_debobigegoPanel">
			<XDraggable class="zoaiodol" v-model="reactions" :item-key="item => item" animation="150" delay="100" delay-on-touch-only="true">
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
		<div class="_debobigegoCaption">{{ $ts.reactionSettingDescription2 }} <button class="_textButton" @click="preview">{{ $ts.preview }}</button></div>
	</div>

	<FormRadios v-model="reactionPickerWidth">
		<template #desc>{{ $ts.width }}</template>
		<option :value="1">{{ $ts.small }}</option>
		<option :value="2">{{ $ts.medium }}</option>
		<option :value="3">{{ $ts.large }}</option>
	</FormRadios>
	<FormRadios v-model="reactionPickerHeight">
		<template #desc>{{ $ts.height }}</template>
		<option :value="1">{{ $ts.small }}</option>
		<option :value="2">{{ $ts.medium }}</option>
		<option :value="3">{{ $ts.large }}</option>
	</FormRadios>
	<FormButton @click="preview"><i class="fas fa-eye"></i> {{ $ts.preview }}</FormButton>
	<FormButton danger @click="setDefault"><i class="fas fa-undo"></i> {{ $ts.default }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XDraggable from 'vuedraggable';
import FormInput from '@client/components/debobigego/input.vue';
import FormRadios from '@client/components/debobigego/radios.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormButton from '@client/components/debobigego/button.vue';
import * as os from '@client/os';
import { defaultStore } from '@client/store';
import * as symbols from '@client/symbols';

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
			os.popup(import('@client/components/emoji-picker-dialog.vue'), {
				asReactionPicker: true,
				src: ev.currentTarget || ev.target,
			}, {}, 'closed');
		},

		async setDefault() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$ts.resetAreYouSure,
				showCancelButton: true
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
