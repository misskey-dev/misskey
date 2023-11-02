<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
  <div :class="$style.root">
    <div :class="$style.top">
      <div :class="$style.banner" :style="{ backgroundImage: `url(${ bannerUrl })` }"></div>
      <button class="_button" :class="$style.instance" @click="openInstanceMenu">
        <img :src="iconUrl" alt="" :class="$style.instanceIcon"/>
      </button>
    </div>
    <div :class="$style.middle">
      <MkA :class="[$style.item, {  [$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]"
           :activeClass="$style.active" to="/" exact>
        <i :class="$style.itemIcon" class="ti ti-home ti-fw"></i><span :class="$style.itemText">{{
          i18n.ts.timeline
        }}</span>
      </MkA>
      <template v-for="item in menu">
        <div v-if="item === '-'" :class="$style.divider"></div>
        <component :is="navbarItemDef[item].to ? 'MkA' : 'button'"
                   v-else-if="navbarItemDef[item] && (navbarItemDef[item].show !== false)" class="_button"
                   :class="[$style.item, { [$style.active]: gaming === '' && navbarItemDef[item].active, [$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]"
                   :activeClass="$style.active" :to="navbarItemDef[item].to"
                   v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}">
          <i class="ti-fw" :class="[$style.itemIcon, navbarItemDef[item].icon]"></i><span
            :class="$style.itemText">{{ navbarItemDef[item].title }}</span>
          <span v-if="navbarItemDef[item].indicated"
                :class="[$style.itemIndicator,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'}]">
					<span v-if="navbarItemDef[item].indicateValue && indicatorCounterToggle" class="_indicateCounter" :class="$style.itemIndicateValueIcon">{{ navbarItemDef[item].indicateValue }}</span><i
             v-else class="_indicatorCircle"></i></span>
        </component>
      </template>
      <div :class="$style.divider"></div>
      <MkA v-if="$i.isAdmin || $i.isModerator"
           :class="[$style.item, {  [$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]"
           :activeClass="$style.active" to="/admin">
        <i :class="$style.itemIcon" class="ti ti-dashboard ti-fw"></i><span
          :class="$style.itemText">{{ i18n.ts.controlPanel }}</span>
      </MkA>
      <button
          :class="[$style.item, {  [$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]"
          class="_button" @click="more">
        <i :class="$style.itemIcon" class="ti ti-grid-dots ti-fw"></i><span :class="$style.itemText">{{
          i18n.ts.more
        }}</span>
        <span v-if="otherMenuItemIndicated"
              :class="[$style.itemIndicator,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light'}]"><i
            class="_indicatorCircle"></i></span>
      </button>
      <MkA :class="[$style.item, {  [$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light' }]"
           :activeClass="$style.active" to="/settings">
        <i :class="$style.itemIcon" class="ti ti-settings ti-fw"></i><span :class="$style.itemText">{{
          i18n.ts.settings
        }}</span>
      </MkA>
    </div>
    <div :class="$style.bottom">
      <button class="_button"
              :class="[$style.post ,{[$style.gamingDark]: gaming === 'dark',[$style.gamingLight]: gaming === 'light',}]"
              data-cy-open-post-form @click="os.post">
        <i :class="$style.postIcon" class="ti ti-pencil ti-fw"></i><span style="position: relative;">{{
          i18n.ts.note
        }}</span>
      </button>
      <button class="_button" :class="$style.account" @click="openAccountMenu">
        <MkAvatar :user="$i" :class="$style.avatar"/>
        <MkAcct :class="$style.acct" class="_nowrap" :user="$i"/>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, defineAsyncComponent, ref, toRef, watch} from 'vue';
import {openInstanceMenu} from './common';
import * as os from '@/os';
import {navbarItemDef} from '@/navbar';
import {$i, openAccountMenu as openAccountMenu_} from '@/account';
import {bannerDark, bannerLight, defaultStore, iconDark, iconLight} from '@/store';
import {i18n} from '@/i18n';
import {instance} from '@/instance';
const indicatorCounterToggle = computed(defaultStore.makeGetterSetter('indicatorCounterToggle'));
let bannerUrl = ref(defaultStore.state.bannerUrl);
let iconUrl = ref(defaultStore.state.iconUrl);
function hexToRgb(hex) {
  // 16進数のカラーコードから "#" を除去
  hex = hex.replace(/^#/, '');

  // 16進数をRGBに変換
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `${r},${g},${b}`;
}
const darkMode = computed(defaultStore.makeGetterSetter('darkMode'));
const gamingMode = computed(defaultStore.makeGetterSetter('gamingMode'));
document.documentElement.style.setProperty('--homeColor', hexToRgb(defaultStore.state.homeColor));
document.documentElement.style.setProperty("--followerColor",hexToRgb(defaultStore.state.followerColor));
document.documentElement.style.setProperty("--specifiedColor",hexToRgb(defaultStore.state.specifiedColor))
document.documentElement.style.setProperty('--gamingspeed', defaultStore.state.numberOfGamingSpeed+'s');

let gaming = ref()
if (darkMode.value) {
  bannerUrl.value = bannerDark;
  iconUrl.value = iconDark;
} else {
  bannerUrl.value = bannerLight;
  iconUrl.value = iconLight;
}
watch(darkMode, () => {
  if (darkMode.value) {
    bannerUrl.value = bannerDark;
    iconUrl.value = iconDark;
  } else {
    bannerUrl.value = bannerLight;
    iconUrl.value = iconLight;
  }
})
// gaming.valueに新しい値を代入する
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
const menu = toRef(defaultStore.state, 'menu');
const otherMenuItemIndicated = computed(() => {
  for (const def in navbarItemDef) {
    if (menu.value.includes(def)) continue;
    if (navbarItemDef[def].indicated) return true;
  }
  return false;
});

function openAccountMenu(ev: MouseEvent) {
  openAccountMenu_({
    withExtraOperation: true,
  }, ev);
}

function more() {
  os.popup(defineAsyncComponent(() => import('@/components/MkLaunchPad.vue')), {}, {}, 'closed');
}
</script>

<style lang="scss" module>
.root {
  display: flex;
  flex-direction: column;
}

.top {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 20px 0;
  background: var(--X14);
  -webkit-backdrop-filter: var(--blur, blur(8px));
  backdrop-filter: var(--blur, blur(8px));
}

.banner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center center;
  -webkit-mask-image: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.75) 20%);
  mask-image: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.75) 20%);
}

.instance {
  position: relative;
  display: block;
  text-align: center;
  width: 100%;
}

.instanceIcon {
  display: inline-block;
  width: 38px;
  aspect-ratio: 1;
}

.bottom {
  position: sticky;
  bottom: 0;
  padding: 20px 0;
  background: var(--X14);
  -webkit-backdrop-filter: var(--blur, blur(8px));
  backdrop-filter: var(--blur, blur(8px));
}

.post {
  position: relative;
  display: block;
  width: 100%;
  height: 40px;
  color: var(--fgOnAccent);
  font-weight: bold;
  text-align: left;

  &:before {
    content: "";
    display: block;
    width: calc(100% - 38px);
    height: 100%;
    margin: auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
  }

  &:hover, &.active {
    &:before {
      background: var(--accentLighten);
    }
  }

  &.gamingLight:before {
    content: "";
    display: block;
    width: calc(100% - 38px);
    height: 100%;
    margin: auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 999px;
    background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
    background-size: 1800% 1800% !important;
    -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
  }

  &.gamingLight:hover, &.gamingLight.active {
    &.gamingLight:before {
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    }
  }

  &.gamingDark:before {
    content: "";
    display: block;
    width: calc(100% - 38px);
    height: 100%;
    margin: auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 999px;
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
    background-size: 1800% 1800%;
    -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
    -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
    animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
  }

  &.gamingDark:hover, &.gamingDark.active {
    &.gamingDark:before {
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    }
  }


}

.postIcon {
  position: relative;
  margin-left: 30px;
  margin-right: 8px;
  width: 32px;
}

.account {
  position: relative;
  display: flex;
  align-items: center;
  padding-left: 30px;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
  margin-top: 16px;
}

.avatar {
  display: block;
  flex-shrink: 0;
  position: relative;
  width: 32px;
  aspect-ratio: 1;
  margin-right: 8px;
}

.acct {
  display: block;
  flex-shrink: 1;
  padding-right: 8px;
}

.middle {
  flex: 1;
}

.divider {
  margin: 16px 16px;
  border-top: solid 0.5px var(--divider);
}

.item {
  position: relative;
  display: block;
  padding-left: 24px;
  line-height: 2.85rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  text-align: left;
  box-sizing: border-box;
  color: var(--navFg);

  &:hover {
    text-decoration: none;
    color: var(--navHoverFg);
  }

  &.active {
    color: var(--navActive);
  }

  &:hover, &.active {
    &:before {
      content: "";
      display: block;
      width: calc(100% - 24px);
      height: 100%;
      margin: auto;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 999px;
      background: var(--accentedBg);
    }
  }

  &.gamingDark:hover, &.gamingDark.active {
    text-decoration: none;
    color: black;

    &.gamingDark:before {
      content: "";
      display: block;
      height: 100%;
      aspect-ratio: 1;
      margin: auto;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 999px;
      background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationDark var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    }
  }

  &.gamingLight:hover, &.gamingLight.active {
    text-decoration: none;
    color: white;

    &.gamingLight:before {
      content: "";
      display: block;
      height: 100%;
      aspect-ratio: 1;
      margin: auto;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 999px;
      background: linear-gradient(270deg, #c06161, #c0a567, #b6ba69, #81bc72, #63c3be, #8bacd6, #9f8bd6, #d18bd6, #d883b4);
      background-size: 1800% 1800% !important;
      -webkit-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      -moz-animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
      animation: AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
    }
  }
}

.itemIcon {
  position: relative;
  width: 32px;
  margin-right: 8px;
}

.itemIndicator {
  position: absolute;
  top: 0;
  left: 20px;
  color: var(--navIndicator);
  font-size: 8px;
  animation: blink 1s infinite;

  &.gamingDark {
    color: white;
  }

  &.gamingLight {
    color: black;
  }
	position: absolute;
	top: 0;
	left: 20px;
	color: var(--navIndicator);
	font-size: 8px;
	animation: blink 1s infinite;

	&:has(.itemIndicateValueIcon) {
		animation: none;
		left: auto;
		right: 20px;
	}
}

.itemText {
  position: relative;
  font-size: 0.9em;
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
