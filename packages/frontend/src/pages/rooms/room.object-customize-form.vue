<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div class="_gaps">
		<div v-for="[k, s] in Object.entries(schema)" :key="k">
			<div>{{ s.label }}</div>
			<div v-if="s.type === 'color'">
				<!-- debounce or throttleしないとカラーピッカー上で高速でなぞったときになぜか無限ループになる。ワーカーとの間でラグがあるため、少し前の値がまたmodelValueとしてフィードバックされてしまうためだと思われる -->
				<MkInput :modelValue="getHex(options[k])" type="color" :throttle="300" @update:modelValue="v => { const c = getRgb(v); if (c != null) emit('update', k, c); }"></MkInput>
			</div>
			<div v-else-if="s.type === 'boolean'">
				<MkSwitch :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkSwitch>
			</div>
			<div v-else-if="s.type === 'enum'">
				<MkSelect :items="s.enum.map(e => ({ label: e.label, value: e.value }))" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkSelect>
			</div>
			<div v-else-if="s.type === 'string'">
				<MkInput type="text" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkInput>
			</div>
			<div v-else-if="s.type === 'range'">
				<MkRange :continuousUpdate="true" :min="s.min" :max="s.max" :step="s.step" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkRange>
			</div>
			<div v-else-if="s.type === 'image'">
				<MkSelect :items="[{ label: i18n.ts.none, value: null }, { label: i18n.ts.custom, value: '_custom_' }, ...(s.presets.length > 0 ? [{ type: 'divider' } as const] : []), ...s.presets.map(e => ({ label: e.label, value: e.value }))]" :modelValue="options[k].type" @update:modelValue="v => changeImageType(k, v)"></MkSelect>

				<div v-if="options[k].type === '_custom_'">
					<MkButton primary inline @click="changeImage(k)">Change</MkButton>
					<MkButton v-if="options[k].driveFileId != null" danger inline iconOnly @click="clearImage(k)"><i class="ti ti-x"></i></MkButton>
				</div>

				<MkRadios :options="[{ label: 'cover', value: 'cover' }, { label: 'contain', value: 'contain' }, { label: 'stretch', value: 'stretch' }]" :modelValue="options[k].fit ?? 'cover'" @update:modelValue="v => changeImageFit(k, v)"></MkRadios>
			</div>
			<div v-else-if="s.type === 'seed'">
				<MkRange :continuousUpdate="true" :min="0" :max="1000" :step="1" :modelValue="options[k]" @update:modelValue="v => emit('update', k, v)"></MkRange>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import type { ObjectDef } from '@/world/room/object.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { getHex, getRgb } from '@/world/utility.js';
import { chooseDriveFile } from '@/utility/drive.js';
import MkRadios from '@/components/MkRadios.vue';

const props = defineProps<{
	schema: ObjectDef['options']['schema'];
	options: any;
	addFileAttachment: ((file: Misskey.entities.DriveFile) => void);
}>();

const emit = defineEmits<{
	(ev: 'update', k: string, v: any): void;
}>();

function changeImageType(k: string, type: string) {
	emit('update', k, { ...props.options[k], type, driveFileId: type === '_custom_' ? props.options[k].driveFileId : null });
}

async function changeImage(k: string) {
	chooseDriveFile({ multiple: false }).then((fileResponse) => {
		if (fileResponse.length === 0) return;
		const file = fileResponse[0];
		if (!file.type.startsWith('image/')) {
			os.alert({
				type: 'error',
				text: 'The selected file is not an image.',
			});
			return;
		}
		if (file.size > 1024 * 1024 * 5) {
			os.alert({
				type: 'error',
				text: 'The file size exceeds the limit of 5MB.',
			});
			return;
		}
		props.addFileAttachment(file);
		emit('update', k, {
			...props.options[k],
			driveFileId: file.id,
		});
	});
}

function clearImage(k: string) {
	emit('update', k, { ...props.options[k], driveFileId: null });
}

function changeImageFit(k: string, fit: string) {
	emit('update', k, { ...props.options[k], fit });
}
</script>

<style lang="scss" module>
.root {
}
</style>
