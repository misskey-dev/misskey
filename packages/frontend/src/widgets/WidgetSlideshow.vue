<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-cy-mkw-slideshow class="kvausudm _panel mkw-slideshow" :style="{ height: widgetProps.height + 'px' }">
	<div @click="choose">
		<p v-if="widgetProps.folderId == null">
			{{ i18n.ts.folder }}
		</p>
		<p v-if="widgetProps.folderId != null && images.length === 0 && !fetching">{{ i18n.ts.nothing }}</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { selectDriveFolder } from '@/utility/drive.js';

const name = 'slideshow';

const widgetPropsDef = {
	height: {
		type: 'number',
		label: i18n.ts._widgetOptions.height,
		default: 300,
	},
	folderId: {
		type: 'string',
		default: null as string | null,
		hidden: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const images = ref<Misskey.entities.DriveFile[]>([]);
const fetching = ref(true);
const slideA = useTemplateRef('slideA');
const slideB = useTemplateRef('slideB');

const change = () => {
	if (images.value.length === 0 || slideA.value == null || slideB.value == null) return;

	const index = Math.floor(Math.random() * images.value.length);
	const img = `url(${ images.value[index].url })`;

	slideB.value.style.backgroundImage = img;

	slideB.value.classList.add('anime');
	window.setTimeout(() => {
		// 既にこのウィジェットがunmountされていたら要素がない
		if (slideA.value == null) return;

		slideA.value.style.backgroundImage = img;

		slideB.value!.classList.remove('anime');
	}, 1000);
};

const fetch = () => {
	if (slideA.value == null || slideB.value == null) return;
	fetching.value = true;

	misskeyApi('drive/files', {
		folderId: widgetProps.folderId,
		type: 'image/*',
		limit: 100,
	}).then(res => {
		images.value = res;
		fetching.value = false;
		slideA.value!.style.backgroundImage = '';
		slideB.value!.style.backgroundImage = '';
		change();
	});
};

const choose = () => {
	selectDriveFolder(null).then(({ folders, canceled }) => {
		if (canceled || folders[0] == null) {
			return;
		}
		widgetProps.folderId = folders[0].id;
		save();
		fetch();
	});
};

useInterval(change, 10000, {
	immediate: false,
	afterMounted: true,
});

onMounted(() => {
	if (widgetProps.folderId != null) {
		fetch();
	}
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.kvausudm {
	position: relative;

	> div {
		width: 100%;
		height: 100%;
		cursor: pointer;

		> p {
			display: block;
			margin: 1em;
			text-align: center;
			color: #888;
		}

		> * {
			pointer-events: none;
		}

		> .slide {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-size: cover;
			background-position: center;

			&.b {
				opacity: 0;
			}

			&.anime {
				transition: opacity 1s;
				opacity: 1;
			}
		}
	}
}
</style>
