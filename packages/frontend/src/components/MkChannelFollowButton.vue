<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	class="_button"
	:class="[$style.root, { [$style.wait]: wait, [$style.active]: isFollowing, [$style.full]: full },[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'}]]"
	:disabled="wait"
	@click="onClick"
>
	<template v-if="!wait">
		<template v-if="isFollowing">
			<span v-if="full" :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'}]">{{ i18n.ts.unfollow }}</span><i class="ti ti-minus"></i>
		</template>
		<template v-else>
			<span v-if="full" :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'}]">{{ i18n.ts.follow }}</span><i class="ti ti-plus"></i>
		</template>
	</template>
	<template v-else>
		<span v-if="full" :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'}]">{{ i18n.ts.processing }}</span><MkLoading :em="true"/>
	</template>
</button>
</template>

<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import {defaultStore} from "@/store.js";

const props = withDefaults(defineProps<{
	channel: Record<string, any>;
	full?: boolean;
}>(), {
	full: false,
});


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
  console.log(gaming)
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
const isFollowing = ref<boolean>(props.channel.isFollowing);
const wait = ref(false);

async function onClick() {
	wait.value = true;

	try {
		if (isFollowing.value) {
			await os.api('channels/unfollow', {
				channelId: props.channel.id,
			});
			isFollowing.value = false;
		} else {
			await os.api('channels/follow', {
				channelId: props.channel.id,
			});
			isFollowing.value = true;
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait.value = false;
	}
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	font-weight: bold;
	color: var(--accent);
	background: transparent;
	border: solid 1px var(--accent);
	padding: 0;
	height: 31px;
	font-size: 16px;
	border-radius: 32px;
	background: #fff;
  &.gamingDark {
    color: black;
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
    background-size: 1800% 1800%;
    -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &.gamingLight {
    color: #fff;
    background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

  }
	&.full {
		padding: 0 8px 0 12px;
		font-size: 14px;
	}

	&:not(.full) {
		width: 31px;
	}

	&:focus-visible {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -5px;
			right: -5px;
			bottom: -5px;
			left: -5px;
			border: 2px solid var(--focus);
			border-radius: 32px;
		}
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

  &.active {
    color: var(--fgOnAccent);
    background: var(--accent);

    &:hover {
      background: var(--accentLighten);
      border-color: var(--accentLighten);
    }

    &:active {
      background: var(--accentDarken);
      border-color: var(--accentDarken);
    }

    &.gamingDark:hover {
      -webkit-text-fill-color: unset;
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    }

    &.gamingDark:active {
      -webkit-text-fill-color: unset !important;
      color: white;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      border-color: white;
    }

    &.gamingLight:hover {
      -webkit-text-fill-color: unset !important;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      border-color: white;
    }

    &.gamingLight:active {
      -webkit-text-fill-color: unset !important;
      color: white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      border-color: white;
    }

    &.gamingDark {
      -webkit-text-fill-color: unset !important;
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    }

    &.gamingLight {
      -webkit-text-fill-color: unset !important;
      color: white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;

    }

    &.wait {
      cursor: wait !important;
      opacity: 0.7;
    }
  }
}

.text {
	margin-right: 6px;
}
</style>
