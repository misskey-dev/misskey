<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer v-if="!matchingAny && !matchingUser" :contentMax="600">
	<div class="_gaps">
		<div>
			<img src="/client-assets/reversi/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
		</div>

		<div class="_panel _gaps" style="padding: 16px;">
			<div class="_buttonsCenter">
				<MkButton primary gradate rounded @click="matchAny">{{ i18n.ts._reversi.freeMatch }}</MkButton>
				<MkButton primary gradate rounded @click="matchUser">{{ i18n.ts.invite }}</MkButton>
			</div>
			<div style="font-size: 90%; opacity: 0.7; text-align: center;"><i class="ti ti-music"></i> {{ i18n.ts.soundWillBePlayed }}</div>
		</div>

		<MkFolder v-if="invitations.length > 0" :defaultOpen="true">
			<template #label>{{ i18n.ts.invitations }}</template>
			<div class="_gaps_s">
				<button v-for="user in invitations" :key="user.id" v-panel :class="$style.invitation" class="_button" tabindex="-1" @click="accept(user)">
					<MkAvatar style="width: 32px; height: 32px; margin-right: 8px;" :user="user" :showIndicator="true"/>
					<span style="margin-right: 8px;"><b><MkUserName :user="user"/></b></span>
					<span>@{{ user.username }}</span>
				</button>
			</div>
		</MkFolder>

		<MkFolder v-if="$i" :defaultOpen="true">
			<template #label>{{ i18n.ts._reversi.myGames }}</template>
			<MkPagination :pagination="myGamesPagination" :disableAutoLoad="true">
				<template #default="{ items }">
					<div :class="$style.gamePreviews">
						<MkA v-for="g in items" :key="g.id" v-panel :class="[$style.gamePreview, !g.isStarted && !g.isEnded && $style.gamePreviewWaiting, g.isStarted && !g.isEnded && $style.gamePreviewActive]" tabindex="-1" :to="`/reversi/g/${g.id}`">
							<div :class="$style.gamePreviewPlayers">
								<span v-if="g.winnerId === g.user1Id" style="margin-right: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-right: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user1"/>
								<span style="margin: 0 1em;">vs</span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user2"/>
								<span v-if="g.winnerId === g.user1Id" style="margin-left: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-left: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
							</div>
							<div :class="$style.gamePreviewFooter">
								<span v-if="g.isStarted && !g.isEnded" :class="$style.gamePreviewStatusActive">{{ i18n.ts._reversi.playing }}</span>
								<span v-else-if="!g.isEnded" :class="$style.gamePreviewStatusWaiting"><MkEllipsis/></span>
								<span v-else>{{ i18n.ts._reversi.ended }}</span>
								<MkTime style="margin-left: auto; opacity: 0.7;" :time="g.createdAt"/>
							</div>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</MkFolder>

		<MkFolder :defaultOpen="true">
			<template #label>{{ i18n.ts._reversi.allGames }}</template>
			<MkPagination :pagination="gamesPagination" :disableAutoLoad="true">
				<template #default="{ items }">
					<div :class="$style.gamePreviews">
						<MkA v-for="g in items" :key="g.id" v-panel :class="[$style.gamePreview, !g.isStarted && !g.isEnded && $style.gamePreviewWaiting, g.isStarted && !g.isEnded && $style.gamePreviewActive]" tabindex="-1" :to="`/reversi/g/${g.id}`">
							<div :class="$style.gamePreviewPlayers">
								<span v-if="g.winnerId === g.user1Id" style="margin-right: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-right: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user1"/>
								<span style="margin: 0 1em;">vs</span>
								<MkAvatar :class="$style.gamePreviewPlayersAvatar" :user="g.user2"/>
								<span v-if="g.winnerId === g.user1Id" style="margin-left: 0.75em; visibility: hidden;"><i class="ti ti-x"></i></span>
								<span v-if="g.winnerId === g.user2Id" style="margin-left: 0.75em; color: var(--MI_THEME-accent); font-weight: bold;"><i class="ti ti-trophy"></i></span>
							</div>
							<div :class="$style.gamePreviewFooter">
								<span v-if="g.isStarted && !g.isEnded" :class="$style.gamePreviewStatusActive">{{ i18n.ts._reversi.playing }}</span>
								<span v-else-if="!g.isEnded" :class="$style.gamePreviewStatusWaiting"><MkEllipsis/></span>
								<span v-else>{{ i18n.ts._reversi.ended }}</span>
								<MkTime style="margin-left: auto; opacity: 0.7;" :time="g.createdAt"/>
							</div>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</MkFolder>
	</div>
</MkSpacer>
<MkSpacer v-else :contentMax="600">
	<div :class="$style.waitingScreen">
		<div v-if="matchingUser" :class="$style.waitingScreenTitle">
			<I18n :src="i18n.ts.waitingFor" tag="span">
				<template #x>
					<b><MkUserName :user="matchingUser"/></b>
				</template>
			</I18n>
			<MkEllipsis/>
		</div>
		<div v-else :class="$style.waitingScreenTitle">
			{{ i18n.ts._reversi.lookingForPlayer }}<MkEllipsis/>
		</div>
		<div class="cancel">
			<MkButton inline rounded @click="cancelMatching">{{ i18n.ts.cancel }}</MkButton>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useStream } from '@/stream.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import MkPagination from '@/components/MkPagination.vue';
import { useRouter } from '@/router/supplier.js';
import * as os from '@/os.js';
import { useInterval } from '@@/js/use-interval.js';
import { pleaseLogin } from '@/scripts/please-login.js';
import * as sound from '@/scripts/sound.js';

const myGamesPagination = {
	endpoint: 'reversi/games' as const,
	limit: 10,
	params: {
		my: true,
	},
};

const gamesPagination = {
	endpoint: 'reversi/games' as const,
	limit: 10,
};

const router = useRouter();

if ($i) {
	const connection = useStream().useChannel('reversi');

	connection.on('matched', x => {
		if (matchingUser.value != null || matchingAny.value) {
			startGame(x.game);
		}
	});

	connection.on('invited', invitation => {
		if (invitations.value.some(x => x.id === invitation.user.id)) return;
		invitations.value.unshift(invitation.user);
	});

	onUnmounted(() => {
		connection.dispose();
	});
}

const invitations = ref<Misskey.entities.UserLite[]>([]);
const matchingUser = ref<Misskey.entities.UserLite | null>(null);
const matchingAny = ref<boolean>(false);
const noIrregularRules = ref<boolean>(false);

function startGame(game: Misskey.entities.ReversiGameDetailed) {
	matchingUser.value = null;
	matchingAny.value = false;

	sound.playUrl('/client-assets/reversi/matched.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	router.push(`/reversi/g/${game.id}`);
}

async function matchHeatbeat() {
	if (matchingUser.value) {
		const res = await misskeyApi('reversi/match', {
			userId: matchingUser.value.id,
		});

		if (res != null) {
			startGame(res);
		}
	} else if (matchingAny.value) {
		const res = await misskeyApi('reversi/match', {
			userId: null,
			noIrregularRules: noIrregularRules.value,
		});

		if (res != null) {
			startGame(res);
		}
	}
}

async function matchUser() {
	pleaseLogin();

	const user = await os.selectUser({ includeSelf: false, localOnly: true });
	if (user == null) return;

	matchingUser.value = user;

	matchHeatbeat();
}

function matchAny(ev: MouseEvent) {
	pleaseLogin();

	os.popupMenu([{
		text: i18n.ts._reversi.allowIrregularRules,
		action: () => {
			noIrregularRules.value = false;
			matchingAny.value = true;
			matchHeatbeat();
		},
	}, {
		text: i18n.ts._reversi.disallowIrregularRules,
		action: () => {
			noIrregularRules.value = true;
			matchingAny.value = true;
			matchHeatbeat();
		},
	}], ev.currentTarget ?? ev.target);
}

function cancelMatching() {
	if (matchingUser.value) {
		misskeyApi('reversi/cancel-match', { userId: matchingUser.value.id });
		matchingUser.value = null;
	} else if (matchingAny.value) {
		misskeyApi('reversi/cancel-match', { userId: null });
		matchingAny.value = false;
	}
}

async function accept(user) {
	const game = await misskeyApi('reversi/match', {
		userId: user.id,
	});
	if (game) {
		startGame(game);
	}
}

useInterval(matchHeatbeat, 1000 * 5, { immediate: false, afterMounted: true });

onMounted(() => {
	misskeyApi('reversi/invitations').then(_invitations => {
		invitations.value = _invitations;
	});

	window.addEventListener('beforeunload', cancelMatching);
});

onDeactivated(() => {
	cancelMatching();
});

onUnmounted(() => {
	cancelMatching();
});

definePageMetadata(() => ({
	title: 'Reversi',
	icon: 'ti ti-device-gamepad',
}));
</script>

<style lang="scss" module>
@keyframes blink {
	0% { opacity: 1; }
	50% { opacity: 0.2; }
}

.invitation {
	display: flex;
	box-sizing: border-box;
	width: 100%;
	padding: 16px;
	line-height: 32px;
	text-align: left;
}

.gamePreviews {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--MI-margin);
}

.gamePreview {
	font-size: 90%;
	border-radius: 8px;
	overflow: clip;
}

.gamePreviewActive {
	box-shadow: inset 0 0 8px 0px var(--MI_THEME-accent);
}

.gamePreviewWaiting {
	box-shadow: inset 0 0 8px 0px var(--MI_THEME-warn);
}

.gamePreviewPlayers {
	text-align: center;
	padding: 16px;
	line-height: 32px;
}

.gamePreviewPlayersAvatar {
	width: 32px;
	height: 32px;

	&:first-child {
		margin-right: 8px;
	}

	&:last-child {
		margin-left: 8px;
	}
}

.gamePreviewFooter {
	display: flex;
	align-items: baseline;
	border-top: solid 0.5px var(--MI_THEME-divider);
	padding: 6px 10px;
	font-size: 0.9em;
}

.gamePreviewStatusActive {
	color: var(--MI_THEME-accent);
	font-weight: bold;
	animation: blink 2s infinite;
}

.gamePreviewStatusWaiting {
	color: var(--MI_THEME-warn);
	font-weight: bold;
	animation: blink 2s infinite;
}

.waitingScreen {
	text-align: center;
}

.waitingScreenTitle {
	font-size: 1.5em;
	margin-bottom: 16px;
	margin-top: 32px;
}
</style>
