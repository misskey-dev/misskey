<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance" :class="$style.root">
	<div :class="[$style.main, $style.panel]">
		<img v-if="miLocalStorage.getItem('kawaii')" src="/client-assets/kawaii/misskey-io.png" alt="Logo by @sawaratsuki@misskey.io" :class="$style.mainIconAlt"/>
		<img v-else :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.mainIcon"/>
		<button class="_button _acrylic" :class="$style.mainMenu" @click="showMenu"><i class="ti ti-dots"></i></button>
		<div :class="$style.mainFg">
			<h1 :class="$style.mainTitle">
				<!-- 背景色によってはロゴが見えなくなるのでとりあえず無効に -->
				<!-- <img class="logo" v-if="instance.logoImageUrl" :src="instance.logoImageUrl"><span v-else class="text">{{ instanceName }}</span> -->
				<span>{{ instanceName }}</span>
			</h1>
			<div :class="$style.mainAbout">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-html="instance.description || i18n.ts.headlineMisskey"></div>
			</div>
			<div v-if="instance.disableRegistration" :class="$style.mainWarn">
				<MkInfo warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
			</div>
			<div class="_gaps_s" :class="$style.mainActions">
				<MkButton :class="$style.mainAction" full rounded gradate data-cy-signup style="margin-right: 12px;" @click="signup()">{{ i18n.ts.joinThisServer }}</MkButton>
				<MkButton :class="$style.mainAction" full rounded @click="exploreOtherServers()">{{ i18n.ts.exploreOtherServers }}</MkButton>
				<MkButton :class="$style.mainAction" full rounded data-cy-signin @click="signin()">{{ i18n.ts.login }}</MkButton>
			</div>
		</div>
	</div>
	<div v-if="stats" :class="$style.stats">
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ i18n.ts.users }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats.originalUsersCount"/></div>
		</div>
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ i18n.ts.notes }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats.originalNotesCount"/></div>
		</div>
	</div>
	<div v-if="instance.policies.ltlAvailable" :class="[$style.tl, $style.panel]">
		<div :class="$style.tlHeader">{{ i18n.ts.letsLookAtTimeline }}</div>
		<div :class="$style.tlBody">
			<MkTimeline src="local"/>
		</div>
	</div>
	<div :class="$style.panel">
		<XActiveUsersChart/>
	</div>
	<div :class="[$style.footer, $style.panel]">
		<div :class="$style.sponsors">
			<div><Mfm text="$[jelly ❤]"/> Sponsored by</div>
			<a title="Skeb" href="https://skeb.jp/" target="_blank"><img src="https://media.misskeyusercontent.jp/misskey-io/sponsors/skeb.png" alt="Skeb" width="140"></a>
		</div>
		<div :class="$style.legalNotice">
			<div>© {{ new Date().getFullYear() }} MisskeyHQ Inc.</div>
			<a href="https://go.misskey.io/legal-notice" target="_blank" rel="noopener"><u>特定商取引法に基づく表記</u></a>
		</div>
		<div :class="$style.links">
			<a href="#" @click="os.pageWindow('/about')"><u>{{ instanceName }}</u></a>
			<a href="#" @click="os.pageWindow('/about-misskey')"><u>{{ i18n.ts.aboutMisskey }}</u></a>
			<a v-if="instance.tosUrl" :href="instance.tosUrl" target="_blank" rel="noopener"><u>{{ i18n.ts.termsOfService }}</u></a>
			<a v-if="instance.privacyPolicyUrl" :href="instance.privacyPolicyUrl" target="_blank" rel="noopener"><u>{{ i18n.ts.privacyPolicy }}</u></a>
			<a v-if="instance.impressumUrl" :href="instance.impressumUrl" target="_blank" rel="noopener"><u>{{ i18n.ts.impressum }}</u></a>
			<a v-if="instance.feedbackUrl" :href="instance.feedbackUrl" target="_blank" rel="noopener"><u>{{ i18n.ts.support }}</u></a>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
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
import { miLocalStorage } from '@/local-storage.js';
import MkNumber from '@/components/MkNumber.vue';
import XActiveUsersChart from '@/components/MkVisitorDashboard.ActiveUsersChart.vue';
import { openInstanceMenu } from '@/ui/_common_/common';

const stats = ref<Misskey.entities.StatsResponse | null>(null);

misskeyApi('stats', {}).then((res) => {
	stats.value = res;
});

function signin() {
	os.popup(XSigninDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function signup() {
	os.popup(XSignupDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function showMenu(ev) {
	openInstanceMenu(ev);
}

function exploreOtherServers() {
	window.open('https://misskey-hub.net/servers/', '_blank', 'noopener');
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
	background: var(--panel);
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

.mainIconAlt {
	width: 85%;
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

.footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 12px 16px;
	gap: 8px 8px;
}

.legalNotice {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.sponsors {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px 8px;
}

.links {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 8px 8px;
}
</style>
