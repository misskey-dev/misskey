<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer v-if="!matchingAny && !matchingUser" :contentMax="600" class="bgvwxkhb">
	<h1>Misskey {{ i18n.ts._reversi.reversi }}</h1>

	<div class="_gaps">
		<div class="_buttonsCenter">
			<MkButton primary rounded @click="matchAny">Match</MkButton>
			<MkButton primary rounded @click="matchUser">{{ i18n.ts.invite }}</MkButton>
		</div>

		<MkFolder v-if="invitations.length > 0">
			<template #header>{{ i18n.ts.invitations }}</template>
			<div class="nfcacttm">
				<button v-for="invitation in invitations" class="invitation _panel _button" tabindex="-1" @click="accept(invitation)">
					<MkAvatar class="avatar" :user="invitation.parent" :showIndicator="true"/>
					<span class="name"><b><MkUserName :user="invitation.parent"/></b></span>
					<span class="username">@{{ invitation.parent.username }}</span>
					<MkTime :time="invitation.createdAt" class="time"/>
				</button>
			</div>
		</MkFolder>

		<MkFolder v-if="$i" :defaultOpen="true">
			<template #label>{{ i18n.ts._reversi.myGames }}</template>
			<MkPagination :pagination="myGamesPagination">
				<template #default="{ items }">
					<div class="knextgwz">
						<MkA v-for="g in items" :key="g.id" class="game _panel" tabindex="-1" :to="`/games/reversi/${g.id}`">
							<div class="players">
								<MkAvatar class="avatar" :user="g.user1"/><b><MkUserName :user="g.user1"/></b> vs <b><MkUserName :user="g.user2"/></b><MkAvatar class="avatar" :user="g.user2"/>
							</div>
							<footer><span class="state" :class="{ playing: !g.isEnded }">{{ g.isEnded ? i18n.ts._reversi.ended : i18n.ts._reversi.playing }}</span><MkTime class="time" :time="g.createdAt"/></footer>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</MkFolder>

		<MkFolder :defaultOpen="true">
			<template #label>{{ i18n.ts._reversi.allGames }}</template>
			<MkPagination :pagination="gamesPagination">
				<template #default="{ items }">
					<div class="knextgwz">
						<MkA v-for="g in items" :key="g.id" class="game _panel" tabindex="-1" :to="`/games/reversi/${g.id}`">
							<div class="players">
								<MkAvatar class="avatar" :user="g.user1"/><b><MkUserName :user="g.user1"/></b> vs <b><MkUserName :user="g.user2"/></b><MkAvatar class="avatar" :user="g.user2"/>
							</div>
							<footer><span class="state" :class="{ playing: !g.isEnded }">{{ g.isEnded ? i18n.ts._reversi.ended : i18n.ts._reversi.playing }}</span><MkTime class="time" :time="g.createdAt"/></footer>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</MkFolder>
	</div>
</MkSpacer>
<div v-else class="sazhgisb">
	<h1 v-if="matchingUser">
		<I18n :src="i18n.ts.waitingFor" tag="span">
			<template #x>
				<b><MkUserName :user="matchingUser"/></b>
			</template>
		</I18n>
		<MkEllipsis/>
	</h1>
	<h1 v-else>
		Matching
		<MkEllipsis/>
	</h1>
	<div class="cancel">
		<MkButton inline round @click="cancelMatching">{{ i18n.ts.cancel }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useStream } from '@/stream.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import MkPagination from '@/components/MkPagination.vue';
import { useRouter } from '@/global/router/supplier.js';
import * as os from '@/os.js';
import { useInterval } from '@/scripts/use-interval.js';

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
		startGame(x.game);
	});

	connection.on('invited', invite => {
		invitations.value.unshift(invite);
	});

	onUnmounted(() => {
		connection.dispose();
	});
}

const invitations = ref<Misskey.entities.UserLite[]>([]);
const matchingUser = ref<Misskey.entities.UserLite | null>(null);
const matchingAny = ref<boolean>(false);

function startGame(game: Misskey.entities.ReversiGameDetailed) {
	matchingUser.value = null;
	matchingAny.value = false;
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
		});

		if (res != null) {
			startGame(res);
		}
	}
}

async function matchUser() {
	const user = await os.selectUser({ local: true });
	if (user == null) return;

	matchingUser.value = user;

	matchHeatbeat();
}

async function matchAny() {
	matchingAny.value = true;

	matchHeatbeat();
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

async function accept(invitation) {
	const game = await misskeyApi('reversi/match', {
		userId: invitation.parent.id,
	});
	if (game) {
		startGame(game);
	}
}

useInterval(matchHeatbeat, 1000 * 10, { immediate: false, afterMounted: true });

onMounted(() => {
	misskeyApi('reversi/invitations').then(_invitations => {
		invitations.value = _invitations;
	});
});

definePageMetadata(computed(() => ({
	title: 'Reversi',
	icon: 'ti ti-device-gamepad',
})));
</script>

	<style lang="scss" scoped>
	.bgvwxkhb {
		> h1 {
			margin: 0;
			padding: 24px;
			text-align: center;
			font-size: 1.5em;
			background: linear-gradient(0deg, #43c583, #438881);
			color: #fff;
		}

		> .play {
			text-align: center;
		}
	}

	.sazhgisb {
		text-align: center;
	}

	.nfcacttm {
		> .invitation {
			display: flex;
			box-sizing: border-box;
			width: 100%;
			padding: 16px;
			line-height: 32px;
			text-align: left;

			> .avatar {
				width: 32px;
				height: 32px;
				margin-right: 8px;
			}

			> .name {
				margin-right: 8px;
			}

			> .username {
				margin-right: 8px;
				opacity: 0.7;
			}

			> .time {
				margin-left: auto;
				opacity: 0.7;
			}
		}
	}

	.knextgwz {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);

		> .game {
			> .players {
				text-align: center;
				padding: 16px;
				line-height: 32px;

				> .avatar {
					width: 32px;
					height: 32px;

					&:first-child {
						margin-right: 8px;
					}

					&:last-child {
						margin-left: 8px;
					}
				}
			}

			> footer {
				display: flex;
				align-items: baseline;
				border-top: solid 0.5px var(--divider);
				padding: 6px 8px;
				font-size: 0.9em;

				> .state {
					&.playing {
						color: var(--accent);
					}
				}

				> .time {
					margin-left: auto;
					opacity: 0.7;
				}
			}
		}
	}
	</style>
