<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	@close="cancel"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.avatarDecorations }}</template>

	<div>
		<MkSpacer :marginMin="20" :marginMax="28">
			<div style="text-align: center;">
				<div :class="$style.name">{{ decoration.name }}</div>
				<MkAvatar style="width: 64px; height: 64px; margin-bottom: 20px;" :user="$i" :decoration="{ url: decoration.url, angle, flipH }" forceShowDecoration/>
			</div>
			<div class="_gaps_s">
				<MkRange v-model="angle" continuousUpdate :min="-0.5" :max="0.5" :step="0.025" :textConverter="(v) => `${Math.floor(v * 360)}°`">
					<template #label>{{ i18n.ts.angle }}</template>
				</MkRange>
				<MkSwitch v-model="flipH">
					<template #label>{{ i18n.ts.flip }}</template>
				</MkSwitch>
			</div>
		</MkSpacer>

		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton v-if="using" primary rounded @click="attach"><i class="ti ti-check"></i> {{ i18n.ts.update }}</MkButton>
			<MkButton v-if="using" rounded @click="detach"><i class="ti ti-x"></i> {{ i18n.ts.detach }}</MkButton>
			<MkButton v-else primary rounded @click="attach"><i class="ti ti-check"></i> {{ i18n.ts.attach }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef, ref, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import MkFolder from '@/components/MkFolder.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkRange from '@/components/MkRange.vue';
import { $i } from '@/account.js';

const props = defineProps<{
	decoration: {
		id: string;
		url: string;
	}
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const using = computed(() => $i.avatarDecorations.some(x => x.id === props.decoration.id));
const angle = ref(using.value ? $i.avatarDecorations.find(x => x.id === props.decoration.id).angle ?? 0 : 0);
const flipH = ref(using.value ? $i.avatarDecorations.find(x => x.id === props.decoration.id).flipH ?? false : false);

function cancel() {
	dialog.value.close();
}

async function attach() {
	const decoration = {
		id: props.decoration.id,
		angle: angle.value,
		flipH: flipH.value,
	};
	await os.apiWithDialog('i/update', {
		avatarDecorations: [decoration],
	});
	$i.avatarDecorations = [decoration];

	dialog.value.close();
}

async function detach() {
	await os.apiWithDialog('i/update', {
		avatarDecorations: [],
	});
	$i.avatarDecorations = [];

	dialog.value.close();
}
</script>

<style lang="scss" module>
.name {
	position: relative;
	z-index: 10;
	font-weight: bold;
	margin-bottom: 28px;
}

.footer {
	position: sticky;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--divider);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
