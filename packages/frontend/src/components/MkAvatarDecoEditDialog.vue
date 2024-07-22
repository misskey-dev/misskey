<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	@close="dialog.close()"
	@closed="$emit('closed')"
>
	<template v-if="avatarDecoration" #header>:{{ avatarDecoration.name }}</template>
	<template v-else #header>New create</template>

	<div>
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m">
				<div class="_gaps_m">
					<XDecoration
						v-if="avatarDecoration"
						:key="avatarDecoration.id"
						:decoration="avatarDecoration"
					/>
					<MkInput v-model="name">
						<template #label>{{ i18n.ts.name }}</template>
					</MkInput>
					<MkTextarea v-model="description">
						<template #label>{{ i18n.ts.description }}</template>
					</MkTextarea>
					<MkInput v-model="url">
						<template #label>{{ i18n.ts.imageUrl }}</template>
					</MkInput>
					<MkInput v-model="category">
						<template #label>{{ i18n.ts.category }}</template>
					</MkInput>
				</div>
			</div>
		</MkSpacer>
		<div :class="$style.footer">
			<div :class="$style.footerButtons">
				<MkButton danger rounded style="margin: 0 auto;" @click="del()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
				<MkButton primary rounded style="margin: 0 auto;" @click="save"><i class="ti ti-check"></i> {{ props.avatarDecoration ? i18n.ts.update : i18n.ts.create }}</MkButton>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import XDecoration from '@/pages/settings/avatar-decoration.decoration.vue';
const props = defineProps<{
    avatarDecoration?: {
				id: string | null;
				name: string;
				description: string;
				url: string;
				category: string;
		};
}>();
let name = ref(props.avatarDecoration?.name ?? '');
let category = ref(props.avatarDecoration?.category ?? '');
let description = ref(props.avatarDecoration?.description ?? '');
let url = ref(props.avatarDecoration?.url ?? '');
const emit = defineEmits<{
    (ev: 'del'): void
}>();

let dialog = ref<InstanceType<typeof MkModalWindow> | null>(null);

function del() {
	os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: props.avatarDecoration?.name }),
	}).then(({ canceled }) => {
		if (canceled) return;
		misskeyApi('admin/avatar-decorations/delete', { id: props.avatarDecoration?.id }).then(() => {

		});
	});
	emit('del');
}

async function save() {
	if (props.avatarDecoration == null) {
		await os.apiWithDialog('admin/avatar-decorations/create', {
			name: name.value,
			description: description.value,
			url: url.value,
			category: category.value,
		});
	} else {
		await os.apiWithDialog('admin/avatar-decorations/update', {
			id: props.avatarDecoration.id ?? '',
			name: name.value,
			description: description.value,
			url: url.value,
			category: category.value,
		});
	}
	emit('del');
}

</script>

<style lang="scss" module>
.imgs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.imgContainer {
  padding: 8px;
  border-radius: var(--radius);
}

.img {
  display: block;
  height: 64px;
  width: 64px;
  object-fit: contain;
}

.roleItem {
  display: flex;
}

.role {
  flex: 1;
}

.roleUnassign {
  width: 32px;
  height: 32px;
  margin-left: 8px;
  align-self: center;
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

.footerButtons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
