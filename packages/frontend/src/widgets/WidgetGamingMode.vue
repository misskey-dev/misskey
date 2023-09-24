<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
  <MkSwitch v-model="enableGamingMode">{{ i18n.ts.gamingMode }} <template #caption>{{ i18n.ts.gamingModeInfo }} </template></MkSwitch>
</div>
</template>

<script lang="ts" setup>
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form.js';
import MkButton from '@/components/MkButton.vue';
import {i18n} from "@/i18n.js";
import MkSwitch from "@/components/MkSwitch.vue";
import {computed} from "vue";
import {defaultStore} from "@/store.js";
const enableGamingMode = computed(defaultStore.makeGetterSetter('gamingMode'));
const name = 'gamingMode';

const widgetPropsDef = {
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
