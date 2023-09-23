<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
  <button
      class="_button"
      :class="[$style.root, { [$style.wait]: wait, [$style.active]: isFollowing || hasPendingFollowRequestFromYou, [$style.full]: full, [$style.large]: large },{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'
,}]"
      :disabled="wait"
      @click="onClick"
  >
    <template v-if="!wait">
      <template v-if="hasPendingFollowRequestFromYou && user.isLocked">
        <span v-if="full"
              :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light',}]">{{
            i18n.ts.followRequestPending
          }}</span><i class="ti ti-hourglass-empty"></i>
      </template>
      <template v-else-if="hasPendingFollowRequestFromYou && !user.isLocked">
        <!-- つまりリモートフォローの場合。 -->
        <span v-if="full"
              :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }] ">{{
            i18n.ts.processing
          }}</span>
        <MkLoading :em="true" :colored="false"/>
      </template>
      <template v-else-if="isFollowing">
        <span v-if="full"
              :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }] ">{{
            i18n.ts.unfollow
          }}</span><i class="ti ti-minus"></i>
      </template>
      <template v-else-if="!isFollowing && user.isLocked">
        <span v-if="full"
              :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]">{{
            i18n.ts.followRequest
          }}</span><i class="ti ti-plus"></i>
      </template>
      <template v-else-if="!isFollowing && !user.isLocked">
        <span v-if="full"
              :class="[$style.text,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]">{{
            i18n.ts.follow
          }}</span><i class="ti ti-plus"></i>
      </template>
    </template>
    <template v-else>
      <span v-if="full"
            :class="[$style.text,{[$style.gamingDark]: gaming === 'dark' ,[$style.gamingLight]: gaming === 'light'} ]">{{
          i18n.ts.processing
        }}</span>
      <MkLoading :em="true" :colored="false"/>
    </template>
  </button>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import {useStream} from '@/stream.js';
import {i18n} from '@/i18n.js';
import {claimAchievement} from '@/scripts/achievements.js';
import {$i} from '@/account.js';
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
let hasPendingFollowRequestFromYou = $ref(props.user.hasPendingFollowRequestFromYou);
let wait = $ref(false);
const connection = useStream().useChannel('main');

if (props.user.isFollowing == null) {
  os.api('users/show', {
    userId: props.user.id,
  })
      .then(onFollowChange);
}

function onFollowChange(user: Misskey.entities.UserDetailed) {
  if (user.id === props.user.id) {
    isFollowing = user.isFollowing;
    hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
  }
}

async function onClick() {
  wait = true;

  try {
    if (isFollowing) {
      const {canceled} = await os.confirm({
        type: 'warning',
        text: i18n.t('unfollowConfirm', {name: props.user.name || props.user.username}),
      });

      if (canceled) return;

      await os.api('following/delete', {
        userId: props.user.id,
      });
    } else {
      if (hasPendingFollowRequestFromYou) {
        await os.api('following/requests/cancel', {
          userId: props.user.id,
        });
        hasPendingFollowRequestFromYou = false;
      } else {
        await os.api('following/create', {
          userId: props.user.id,
        });
        hasPendingFollowRequestFromYou = true;

        claimAchievement('following1');

        if ($i.followingCount >= 10) {
          claimAchievement('following10');
        }
        if ($i.followingCount >= 50) {
          claimAchievement('following50');
        }
        if ($i.followingCount >= 100) {
          claimAchievement('following100');
        }
        if ($i.followingCount >= 300) {
          claimAchievement('following300');
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    wait = false;
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


  &.gamingDark {
    color: black !important;
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
    background-size: 1800% 1800%;
    -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;

  }

  &.gamingLight {
    color: white !important;
    background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
  }

  &.full {
    padding: 0 8px 0 12px;
    font-size: 14px;
    &.gamingDark {
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;

    }

    &.gamingLight {
      color: white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
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
      -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    }

    &.gamingDark:active {
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      border-color: black;
    }

    &.gamingLight:hover {
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      border-color: black;
    }

    &.gamingLight:active {
      color: white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      border-color: black;
    }

    &.gamingDark {
      -webkit-text-fill-color: unset !important;
      color: black;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800%;
      -webkit-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      -moz-animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
      animation: AnimationDark 44s cubic-bezier(0, 0.2, 0.90, 1) infinite;
    }

    &.gamingLight {
      -webkit-text-fill-color: unset !important;
      color: white;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight 45s cubic-bezier(0, 0.2, 0.90, 1) infinite !important;

    }

  }

  &.wait {
    cursor: wait !important;
    opacity: 0.7;
  }
}

.text {
  margin-right: 6px;

  &.gamingDark {
    color: white;

  }

  &.gamingLight {
    color: white;

  }

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
