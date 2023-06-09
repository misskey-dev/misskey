<template>
<div class="_panel" :class="$style.root">
	<div :class="$style.banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''"></div>
	<MkAvatar :class="$style.avatar" :user="user" indicator/>
	<div :class="$style.title">
		<MkA :class="$style.name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
		<p :class="$style.username"><MkAcct :user="user"/></p>
	</div>
	<span v-if="$i && $i.id !== user.id && user.isFollowed" :class="$style.followed">{{ i18n.ts.followsYou }}</span>
	<div :class="$style.description">
		<div v-if="user.description" :class="$style.mfm">
			<Mfm :text="user.description" :author="user" :i="$i"/>
		</div>
		<span v-else style="opacity: 0.7;">{{ i18n.ts.noAccountDescription }}</span>
	</div>
	<div :class="$style.status">
		<div :class="$style.statusItem">
			<p :class="$style.statusItemLabel">{{ i18n.ts.notes }}</p><span :class="$style.statusItemValue">{{ user.notesCount }}</span>
		</div>
		<template v-if="isFfVisibility($i, props.user)">
			<div :class="$style.statusItem">
				<p :class="$style.statusItemLabel">{{ i18n.ts.following }}</p><span :class="$style.statusItemValue">{{ user.followingCount }}</span>
			</div>
			<div :class="$style.statusItem">
				<p :class="$style.statusItemLabel">{{ i18n.ts.followers }}</p><span :class="$style.statusItemValue">{{ user.followersCount }}</span>
			</div>
		</template>
		<template v-else>
			<div :class="$style.statusItem">
				<p :class="$style.statusItemLabel">{{ i18n.ts.following }}</p><span :class="$style.statusItemValue"><i class="ti ti-lock" :class="[$style.keywigglearea, { [$style.animation]: animation }]"></i></span>
			</div>
			<div :class="$style.statusItem">
				<p :class="$style.statusItemLabel">{{ i18n.ts.followers }}</p><span :class="$style.statusItemValue"><i class="ti ti-lock" :class="[$style.keywigglearea, { [$style.animation]: animation }]"></i></span>
			</div>
		</template>
	</div>
	<MkFollowButton v-if="$i && user.id != $i.id" :class="$style.follow" :user="user" mini/>
</div>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import MkFollowButton from '@/components/MkFollowButton.vue';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { isFfVisibility } from '@/scripts/is-ff-visibility';
import { defaultStore } from '@/store';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();

const animation = $ref(defaultStore.state.animation);
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.banner {
	height: 84px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;
}

.avatar {
	display: block;
	position: absolute;
	top: 62px;
	left: 13px;
	z-index: 2;
	width: 58px;
	height: 58px;
	border: solid 4px var(--panel);
}

.title {
	display: block;
	padding: 10px 0 10px 88px;
}

.name {
	display: inline-block;
	margin: 0;
	font-weight: bold;
	line-height: 16px;
	word-break: break-all;
}

.username {
	display: block;
	margin: 0;
	line-height: 16px;
	font-size: 0.8em;
	color: var(--fg);
	opacity: 0.7;
}

.followed {
	position: absolute;
	top: 12px;
	left: 12px;
	padding: 4px 8px;
	color: #fff;
	background: rgba(0, 0, 0, 0.7);
	font-size: 0.7em;
	border-radius: 6px;
}

.description {
	padding: 16px;
	font-size: 0.8em;
	border-top: solid 0.5px var(--divider);
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.status {
	padding: 10px 16px;
	border-top: solid 0.5px var(--divider);
}

.statusItem {
	display: inline-block;
	width: 33%;
}

.statusItemLabel {
	margin: 0;
	font-size: 0.7em;
	color: var(--fg);
}

.statusItemValue {
	font-size: 1em;
	color: var(--accent);
}

.follow {
	position: absolute !important;
	top: 8px;
	right: 8px;
}

.keywigglearea {
	display: block;
}

@keyframes keywiggle {
	0% { transform: translate(-3px,-1px) rotate(-8deg); }
	5% { transform: translateY(-1px) rotate(-10deg); }
	10% { transform: translate(1px,-3px) rotate(0); }
	15% { transform: translate(1px,1px) rotate(11deg); }
	20% { transform: translate(-2px,1px) rotate(1deg); }
	25% { transform: translate(-1px,-2px) rotate(-2deg); }
	30% { transform: translate(-1px,2px) rotate(-3deg); }
	35% { transform: translate(2px,1px) rotate(6deg); }
	40% { transform: translate(-2px,-3px) rotate(-9deg); }
	45% { transform: translateY(-1px) rotate(-12deg); }
	50% { transform: translate(1px,2px) rotate(10deg); }
	55% { transform: translateY(-3px) rotate(8deg); }
	60% { transform: translate(1px,-1px) rotate(8deg); }
	65% { transform: translateY(-1px) rotate(-7deg); }
	70% { transform: translate(-1px,-3px) rotate(6deg); }
	75% { transform: translateY(-2px) rotate(4deg); }
	80% { transform: translate(-2px,-1px) rotate(3deg); }
	85% { transform: translate(1px,-3px) rotate(-10deg); }
	90% { transform: translate(1px) rotate(3deg); }
	95% { transform: translate(-2px) rotate(-3deg); }
	to { transform: translate(2px,1px) rotate(2deg); }
}

.animation:hover {
	animation: keywiggle 1s;
}
</style>
