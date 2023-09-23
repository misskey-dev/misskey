<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XWidgets :edit="editMode" :widgets="widgets" @addWidget="addWidget" @removeWidget="removeWidget" @updateWidget="updateWidget" @updateWidgets="updateWidgets" @exit="editMode = false"/>

	<button v-if="editMode" class="_textButton" style="font-size: 0.9em;"  :class="{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }" @click="editMode = false"><i class="ti ti-check"></i> {{ i18n.ts.editWidgetsExit }}</button>
	<button v-else class="_textButton" data-cy-widget-edit :class="$style.edit, {[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }" style="font-size: 0.9em;" @click="editMode = true"><i class="ti ti-pencil"></i> {{ i18n.ts.editWidgets }}</button>
</div>
</template>

<script lang="ts">
let editMode = $ref(false);
</script>
<script lang="ts" setup>
import { ref , computed , watch} from 'vue';
import XWidgets from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n.js';
import { defaultStore } from '@/store.js';

let gaming = ref('');

const gamingMode = computed(defaultStore.makeGetterSetter('gamingMode'));
const darkMode = computed(defaultStore.makeGetterSetter('darkMode'));
if (darkMode.value && gamingMode.value == true) {
  gaming.value = 'dark';
} else if (!darkMode.value && gamingMode.value == true) {
  gaming.value = 'light';
} else {
  gaming.value = '';
}

watch(darkMode, () => {
  if (darkMode.value && gamingMode.value == true) {
    gaming.value = 'dark';
  } else if (!darkMode.value && gamingMode.value == true) {
    gaming.value = 'light';
  } else {
    gaming.value = '';
  }
})

watch(gamingMode, () => {
  if (darkMode.value && gamingMode.value == true) {
    gaming.value = 'dark';
  } else if (!darkMode.value && gamingMode.value == true) {
    gaming.value = 'light';
  } else {
    gaming.value = '';
  }
})
const props = withDefaults(defineProps<{
	// null = 全てのウィジェットを表示
	// left = place: leftだけを表示
	// right = rightとnullを表示
	place?: 'left' | null | 'right';
}>(), {
	place: null,
});

const widgets = $computed(() => {
	if (props.place === null) return defaultStore.reactiveState.widgets.value;
	if (props.place === 'left') return defaultStore.reactiveState.widgets.value.filter(w => w.place === 'left');
	return defaultStore.reactiveState.widgets.value.filter(w => w.place !== 'left');
});

function addWidget(widget) {
	defaultStore.set('widgets', [{
		...widget,
		place: props.place,
	}, ...defaultStore.state.widgets]);
}

function removeWidget(widget) {
	defaultStore.set('widgets', defaultStore.state.widgets.filter(w => w.id !== widget.id));
}

function updateWidget({ id, data }) {
	defaultStore.set('widgets', defaultStore.state.widgets.map(w => w.id === id ? {
		...w,
		data,
		place: props.place,
	} : w));
}

function updateWidgets(thisWidgets) {
	if (props.place === null) {
		defaultStore.set('widgets', thisWidgets);
		return;
	}
	if (props.place === 'left') {
		defaultStore.set('widgets', [
			...thisWidgets.map(w => ({ ...w, place: 'left' })),
			...defaultStore.state.widgets.filter(w => w.place !== 'left' && !thisWidgets.some(t => w.id === t.id)),
		]);
		return;
	}
	defaultStore.set('widgets', [
		...defaultStore.state.widgets.filter(w => w.place === 'left' && !thisWidgets.some(t => w.id === t.id)),
		...thisWidgets.map(w => ({ ...w, place: 'right' })),
	]);
}
</script>

<style lang="scss" module>
.edit {
	width: 100%;
  &.gamingDark{
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    -moz-animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  &.gamingLight{
    background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    -moz-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.gamingDark{
  background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);  background-size: 1800% 1800% !important;
  -webkit-animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
  -moz-animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
  animation: AnimationDark 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.gamingLight{
  background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);  background-size: 1800% 1800% !important;
  -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
  -moz-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
  animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.25, 1) infinite !important;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
@-webkit-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}  @keyframes AnimationLight {
     0% {
       background-position: 0% 50%
     }
     50% {
       background-position: 100% 50%
     }
     100% {
       background-position: 0% 50%
     }
   }
@-webkit-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
</style>
