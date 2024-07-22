<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance" :class="$style.root">
	<div :class="[$style.main, $style.panel]">
		<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.mainIcon"/>
		<button class="_button" :class="$style.mainMenu" @click="showMenu"><i class="ti ti-dots"></i></button>
		<div :class="$style.mainFg">
			<h1 :class="$style.mainTitle">
				<!-- 背景色によってはロゴが見えなくなるのでとりあえず無効に -->
				<!-- <img class="logo" v-if="instance.logoImageUrl" :src="instance.logoImageUrl"><span v-else class="text">{{ instanceName }}</span> -->
				<span>{{ instanceName }}</span>
			</h1>
			<div :class="$style.mainAbout">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-html="instance.description || i18n.ts.headlineType4ny"></div>
			</div>
			<div v-if="instance.disableRegistration" :class="$style.mainWarn">
				<MkInfo warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
			</div>
			<div class="_gaps_s " :class="$style.mainActions">
				<MkButton :class="$style.mainAction" full rounded gradate data-cy-signup style="margin-right: 12px;" @click="signup()">{{ i18n.ts.joinThisServer }}</MkButton>
				<MkButton :class="$style.mainAction" full rounded data-cy-signin @click="signin()">{{ i18n.ts.login }}</MkButton>
			</div>
		</div>
	</div>

	<div v-if="instance.policies.ltlAvailable" :class="[$style.tl, $style.panel]">
		<div :class="$style.tlHeader">{{ i18n.ts.letsLookAtTimeline }}</div>
		<div :class="$style.tlBody">
			<MkTimeline :acrylic="true" src="local"/>
		</div>
	</div>
	<div :class="$style.stats">
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ i18n.ts.users }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats?.originalUsersCount"/></div>
		</div>
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ i18n.ts.notes }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats?.originalNotesCount"/></div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu.js';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import MkButton from '@/components/MkButton.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instanceName } from '@/config.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import MkNumber from '@/components/MkNumber.vue';
import XActiveUsersChart from '@/components/MkVisitorDashboard.ActiveUsersChart.vue';
import { openInstanceMenu } from '@/ui/_common_/common.js';

const stats = ref<Misskey.entities.StatsResponse | null>(null);

misskeyApi('stats', {}).then((res) => {
	stats.value = res;
});

function signin() {
	const { dispose } = os.popup(XSigninDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function signup() {
	const { dispose } = os.popup(XSignupDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function showMenu(ev: MouseEvent) {
	openInstanceMenu(ev);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 32px 0 0 0;

}

.panel {
	position: relative;
	background: var(--acrylicPanel);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-radius: var(--radius);
	box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
}

.main {
	text-align: center;
}

.mainIcon {
	width: 85px;
	margin-top: -47px;
	vertical-align: bottom;
	filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
}

.mainMenu {
	position: absolute;
	top: 16px;
	right: 16px;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	font-size: 18px;
}

.mainFg {
	position: relative;
	z-index: 1;
}

.mainTitle {
	display: block;
	margin: 0;
	padding: 16px 32px 24px 32px;
	font-size: 1.4em;
}

.mainLogo {
	vertical-align: bottom;
	max-height: 120px;
	max-width: min(100%, 300px);
}

.mainAbout {
	padding: 0 32px;
}

.mainWarn {
	padding: 32px 32px 0 32px;
}

.mainActions {
	padding: 32px;
}

.mainAction {
	line-height: 28px;
}

.gamingDark{
	color: black;
  background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);
  background-size: 1800% 1800%;
  -webkit-animation:AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
  -moz-animation:AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
  animation:AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite;
}
.gamingDark:hover{
	color: black;
	background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd) !important;
	background-size: 1800% 1800% !important;
	-webkit-animation:AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
	-moz-animation:AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
	animation:AnimationLight var(--gamingspeed) cubic-bezier(0, 0.2, 0.90, 1) infinite !important;
}
.stats {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-gap: 16px;

}

.statsItem {
	overflow: clip;
	padding: 16px 20px;
}

.statsItemLabel {
	color: var(--fgTransparentWeak);
	font-size: 0.9em;
}

.statsItemCount {
	font-weight: bold;
	font-size: 1.2em;
	color: var(--accent);
}

.tl {
	overflow: clip;
}

.tlHeader {
	padding: 12px 16px;
	border-bottom: solid 1px var(--divider);
}

.tlBody {
	height: 350px;
	overflow: auto;
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
