<template>
<div class="_formRoot">
	<FromSlot class="_formBlock">
		<template #label>{{ i18n.ts.reactionSettingDescription }}</template>
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
		<template #caption>{{ i18n.ts.reactionSettingDescription2 }} <button class="_textButton" @click="preview">{{ i18n.ts.preview }}</button></template>
	</FromSlot>

	<FormRadios v-model="reactionPickerSize" class="_formBlock">
		<template #label>{{ i18n.ts.size }}</template>
		<option :value="1">{{ i18n.ts.small }}</option>
		<option :value="2">{{ i18n.ts.medium }}</option>
		<option :value="3">{{ i18n.ts.large }}</option>
	</FormRadios>
	<FormRadios v-model="reactionPickerWidth" class="_formBlock">
		<template #label>{{ i18n.ts.numberOfColumn }}</template>
		<option :value="1">5</option>
		<option :value="2">6</option>
		<option :value="3">7</option>
		<option :value="4">8</option>
		<option :value="5">9</option>
	</FormRadios>
	<FormRadios v-model="reactionPickerHeight" class="_formBlock">
		<template #label>{{ i18n.ts.height }}</template>
		<option :value="1">{{ i18n.ts.small }}</option>
		<option :value="2">{{ i18n.ts.medium }}</option>
		<option :value="3">{{ i18n.ts.large }}</option>
		<option :value="4">{{ i18n.ts.large }}+</option>
	</FormRadios>

	<FormSwitch v-model="reactionPickerUseDrawerForMobile" class="_formBlock">
		{{ i18n.ts.useDrawerReactionPickerForMobile }}
		<template #caption>{{ i18n.ts.needReloadToApply }}</template>
	</FormSwitch>

	<FormSection>
		<div style="display: flex; gap: var(--margin); flex-wrap: wrap;">
			<FormButton inline @click="preview"><i class="fas fa-eye"></i> {{ i18n.ts.preview }}</FormButton>
			<FormButton inline danger @click="setDefault"><i class="fas fa-undo"></i> {{ i18n.ts.default }}</FormButton>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, watch } from 'vue';
import XDraggable from 'vuedraggable';
import FormInput from '@/components/form/input.vue';
import FormRadios from '@/components/form/radios.vue';
import FromSlot from '@/components/form/slot.vue';
import FormButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import FormSwitch from '@/components/form/switch.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let reactions = $ref(JSON.parse(JSON.stringify(defaultStore.state.reactions)));

const reactionPickerSize = $computed(defaultStore.makeGetterSetter('reactionPickerSize'));
const reactionPickerWidth = $computed(defaultStore.makeGetterSetter('reactionPickerWidth'));
const reactionPickerHeight = $computed(defaultStore.makeGetterSetter('reactionPickerHeight'));
const reactionPickerUseDrawerForMobile = $computed(defaultStore.makeGetterSetter('reactionPickerUseDrawerForMobile'));

function save() {
	defaultStore.set('reactions', reactions);
}

function remove(reaction, ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts.remove,
		action: () => {
			reactions = reactions.filter(x => x !== reaction);
		},
	}], ev.currentTarget ?? ev.target);
}

function preview(ev: MouseEvent) {
	os.popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerDialog.vue')), {
		asReactionPicker: true,
		src: ev.currentTarget ?? ev.target,
	}, {}, 'closed');
}

async function setDefault() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.resetAreYouSure,
	});
	if (canceled) return;

	reactions = JSON.parse(JSON.stringify(defaultStore.def.reactions.default));
}

function chooseEmoji(ev: MouseEvent) {
	os.pickEmoji(ev.currentTarget ?? ev.target, {
		showPinned: false,
	}).then(emoji => {
		if (!reactions.includes(emoji)) {
			reactions.push(emoji);
		}
	});
}

watch($$(reactions), () => {
	save();
}, {
	deep: true,
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.reaction,
	icon: 'fas fa-laugh',
	action: {
		icon: 'fas fa-eye',
		handler: preview,
	},
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
