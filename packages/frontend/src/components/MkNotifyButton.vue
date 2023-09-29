<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
  <button
      class="_button"
      :class="[$style.root,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'
,}]"  v-if="isFollowing"
      @click="onClick"
  >
        <span v-if="props.user.notify === 'none'" :class="[{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }] "><i class="ti ti-bell"></i></span>
        <span v-else-if="props.user.notify === 'normal'" :class="[{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]"><i class="ti ti-bell-off"></i></span>
  </button>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import {useStream} from '@/stream.js';
import {defaultStore} from "@/store.js";

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
  user: Misskey.entities.UserDetailed,
  full?: boolean,
  large?: boolean,
}>(), {
  full: false,
  large: false,
});

let isFollowing = $ref(props.user.isFollowing);
let notify = $ref(props.user.notify);
const connection = useStream().useChannel('main');

if (props.user.isFollowing == null) {
  os.api('users/show', {
    userId: props.user.id,
  }).then(onFollowChange);
}

if (props.user.notify == null) {
  os.api('users/show', {
    userId: props.user.id,
  }).then(onNotifyChange);
}

function onFollowChange(user: Misskey.entities.UserDetailed) {
  if (user.id === props.user.id) {
    isFollowing = user.isFollowing;
  }
}
function onNotifyChange(user: Misskey.entities.UserDetailed) {
  if (user.id === props.user.id) {
    notify = user.notify;
    console.log(props.user.notify)
  }
}
async function onClick() {
  try {
      await 		os.apiWithDialog('following/update', {
        userId: props.user.id,
        notify: props.user.notify === 'normal' ? 'none' : 'normal',
      }).then(() => {
        props.user.notify = props.user.notify === 'normal' ? 'none' : 'normal';
      });
  }finally {

  }
}

onMounted(() => {
  connection.on('follow', onFollowChange);
  connection.on('unfollow', onFollowChange);
});
onBeforeUnmount(() => {
  connection.dispose();
});
</script>

<style lang="scss" module>
.root {
  position: relative;
  display: inline-block;
  font-weight: bold;
  color: var(--fgOnWhite);
  border: solid 1px var(--accent);
  padding: 0;
  height: 31px;
  font-size: 16px;
  border-radius: 32px;
  background: #fff;
  vertical-align: bottom;

  &.gamingDark {
    color: black !important;
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
    background-size: 1800% 1800%;
    -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
    -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
    animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
    border: solid 1px black;
  }

  &.gamingLight {
    color: white !important;
    background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    border: solid 1px white;
  }

  &.full {
    padding: 0 8px 0 12px;
    font-size: 14px;
    &.gamingDark {
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;

    }

    &.gamingLight {
      color: white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    }
  }

  &.large {
    font-size: 16px;
    height: 38px;
    padding: 0 12px 0 16px;
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
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      border: solid 1px white;
    }

    &.gamingDark:active {
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      border: solid 1px white;
    }

    &.gamingLight:hover {
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      border: solid 1px white;
    }

    &.gamingLight:active {
      color: white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      border: solid 1px white;
    }

    &.gamingDark {
      -webkit-text-fill-color: unset !important;
      color: black;
      border: solid 1px white;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
    }

    &.gamingLight {
      -webkit-text-fill-color: unset !important;
      color: white;
      border: solid 1px white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;

    }

  }


}


  .gamingDark {
    color: black;

  }

  .gamingLight {
    color: white;

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
}

@keyframes AnimationLight {
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
