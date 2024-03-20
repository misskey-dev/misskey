<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	class="_button"
	:class="[$style.root, { [$style.wait]: wait, [$style.active]: userDetailed.isFollowing || userDetailed.hasPendingFollowRequestFromYou, [$style.full]: full, [$style.large]: large }]"
	:disabled="wait"
	@click="onClick"
>
	<template v-if="!wait">
		<template v-if="userDetailed.hasPendingFollowRequestFromYou && userDetailed.isLocked">
			<span v-if="full" :class="$style.text">{{ i18n.ts.followRequestPending }}</span><i class="ti ti-hourglass-empty"></i>
		</template>
		<template v-else-if="userDetailed.hasPendingFollowRequestFromYou && !userDetailed.isLocked">
			<!-- つまりリモートフォローの場合。 -->
			<span v-if="full" :class="$style.text">{{ i18n.ts.processing }}</span><MkLoading :em="true" :colored="false"/>
		</template>
		<template v-else-if="userDetailed.isFollowing">
			<span v-if="full" :class="$style.text">{{ i18n.ts.unfollow }}</span><i class="ti ti-minus"></i>
		</template>
		<template v-else-if="!userDetailed.isFollowing && userDetailed.isLocked">
			<span v-if="full" :class="$style.text">{{ i18n.ts.followRequest }}</span><i class="ti ti-plus"></i>
		</template>
		<template v-else-if="!userDetailed.isFollowing && !userDetailed.isLocked">
			<span v-if="full" :class="$style.text">{{ i18n.ts.follow }}</span><i class="ti ti-plus"></i>
		</template>
	</template>
	<template v-else>
		<span v-if="full" :class="$style.text">{{ i18n.ts.processing }}</span><MkLoading :em="true" :colored="false"/>
	</template>
</button>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { claimAchievement } from '@/scripts/achievements.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';

const props = withDefaults(defineProps<{
	user: { id: string } & Partial<Misskey.entities.UserDetailed>,
	full?: boolean,
	large?: boolean,
}>(), {
	full: false,
	large: false,
});

const emit = defineEmits<
	(_: 'update:user', value: Misskey.entities.UserDetailed) => void
>();

const userDetailed = ref<{ id: string } & Partial<Misskey.entities.UserDetailed>>(props.user);
const wait = ref(props.user.isLocked === undefined);
const connection = useStream().useChannel('main');

if (userDetailed.value.isLocked === undefined) {
	misskeyApi('users/show', {
		userId: props.user.id,
	})
		.then(onFollowChange)
		.then(() => {
			wait.value = false;
		});
}

function onFollowChange(user: Misskey.entities.UserDetailed) {
	if (user.id === props.user.id) {
		userDetailed.value = user;
	}
}

async function onClick() {
	wait.value = true;

	try {
		if (userDetailed.value.isFollowing) {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: i18n.tsx.unfollowConfirm({ name: (userDetailed.value.name || userDetailed.value.username) ?? i18n.ts.user }),
			});

			if (canceled) return;

			await misskeyApi('following/delete', {
				userId: props.user.id,
			});
		} else {
			if (userDetailed.value.hasPendingFollowRequestFromYou) {
				await misskeyApi('following/requests/cancel', {
					userId: props.user.id,
				});
				userDetailed.value.hasPendingFollowRequestFromYou = false;
			} else {
				await misskeyApi('following/create', {
					userId: props.user.id,
					withReplies: defaultStore.state.defaultWithReplies,
				});
				emit('update:user', {
					...userDetailed.value,
					withReplies: defaultStore.state.defaultWithReplies,
				});
				userDetailed.value.hasPendingFollowRequestFromYou = true;

				if ($i) {
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
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait.value = false;
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

	&.full {
		padding: 0 8px 0 12px;
		font-size: 14px;
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
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}
}

.text {
	margin-right: 6px;
}
</style>
