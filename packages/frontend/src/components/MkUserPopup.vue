<template>
<Transition
	:enterActiveClass="defaultStore.state.animation ? $style.transition_popup_enterActive : ''"
	:leaveActiveClass="defaultStore.state.animation ? $style.transition_popup_leaveActive : ''"
	:enterFromClass="defaultStore.state.animation ? $style.transition_popup_enterFrom : ''"
	:leaveToClass="defaultStore.state.animation ? $style.transition_popup_leaveTo : ''"
	appear @afterLeave="emit('closed')"
>
	<div v-if="showing" :class="$style.root" class="_popup _shadow" :style="{ zIndex, top: top + 'px', left: left + 'px' }" @mouseover="() => { emit('mouseover'); }" @mouseleave="() => { emit('mouseleave'); }">
		<div v-if="user != null">
			<div :class="$style.banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''">
				<span v-if="$i && $i.id != user.id && user.isFollowed" :class="$style.followed">{{ i18n.ts.followsYou }}</span>
			</div>
			<svg viewBox="0 0 128 128" :class="$style.avatarBack">
				<g transform="matrix(1.6,0,0,1.6,-38.4,-51.2)">
					<path d="M64,32C81.661,32 96,46.339 96,64C95.891,72.184 104,72 104,72C104,72 74.096,80 64,80C52.755,80 24,72 24,72C24,72 31.854,72.018 32,64C32,46.339 46.339,32 64,32Z" style="fill: var(--popup);"/>
				</g>
			</svg>
			<MkAvatar :class="$style.avatar" :user="user" indicator/>
			<div :class="$style.title">
				<MkA :class="$style.name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
				<div :class="$style.username"><MkAcct :user="user"/></div>
			</div>
			<div :class="$style.description">
				<Mfm v-if="user.description" :class="$style.mfm" :text="user.description" :author="user" :i="$i"/>
				<div v-else style="opacity: 0.7;">{{ i18n.ts.noAccountDescription }}</div>
			</div>
			<div :class="$style.status">
				<div :class="$style.statusItem">
					<div :class="$style.statusItemLabel">{{ i18n.ts.notes }}</div>
					<div>{{ number(user.notesCount) }}</div>
				</div>
				<template v-if="isFfVisibility($i, user)">
					<div :class="$style.statusItem">
						<div :class="$style.statusItemLabel">{{ i18n.ts.following }}</div>
						<div>{{ number(user.followingCount) }}</div>
					</div>
					<div :class="$style.statusItem">
						<div :class="$style.statusItemLabel">{{ i18n.ts.followers }}</div>
						<div>{{ number(user.followersCount) }}</div>
					</div>
				</template>
				<template v-else>
					<div :class="$style.statusItem">
						<div :class="$style.statusItemLabel">{{ i18n.ts.following }}</div>
						<div><i class="ti ti-lock" :class="{[$style.animation]: animation}"></i></div>
					</div>
					<div :class="$style.statusItem">
						<div :class="$style.statusItemLabel">{{ i18n.ts.followers }}</div>
						<div><i class="ti ti-lock" :class="{[$style.animation]: animation}"></i></div>
					</div>
				</template>
			</div>
			<button class="_button" :class="$style.menu" @click="showMenu"><i class="ti ti-dots"></i></button>
			<MkFollowButton v-if="$i && user.id != $i.id" :class="$style.follow" :user="user" mini/>
		</div>
		<div v-else>
			<MkLoading/>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import * as misskey from 'misskey-js';
import MkFollowButton from '@/components/MkFollowButton.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';
import { getUserMenu } from '@/scripts/get-user-menu';
import number from '@/filters/number';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import { $i } from '@/account';
import { isFfVisibility } from '@/scripts/is-ff-visibility';

const props = defineProps<{
	showing: boolean;
	q: string;
	source: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'mouseover'): void;
	(ev: 'mouseleave'): void;
}>();

const zIndex = os.claimZIndex('middle');

const animation = $ref(defaultStore.state.animation);

let user = $ref<misskey.entities.UserDetailed | null>(null);
let top = $ref(0);
let left = $ref(0);

function showMenu(ev: MouseEvent) {
	os.popupMenu(getUserMenu(user), ev.currentTarget ?? ev.target);
}

onMounted(() => {
	if (typeof props.q === 'object') {
		user = props.q;
	} else {
		const query = props.q.startsWith('@') ?
			Acct.parse(props.q.substr(1)) :
			{ userId: props.q };

		os.api('users/show', query).then(res => {
			if (!props.showing) return;
			user = res;
		});
	}

	const rect = props.source.getBoundingClientRect();
	const x = ((rect.left + (props.source.offsetWidth / 2)) - (300 / 2)) + window.pageXOffset;
	const y = rect.top + props.source.offsetHeight + window.pageYOffset;

	top = y;
	left = x;
});
</script>

<style lang="scss" module>
.transition_popup_enterActive,
.transition_popup_leaveActive {
	transition: opacity 0.15s, transform 0.15s !important;
}
.transition_popup_enterFrom,
.transition_popup_leaveTo {
	opacity: 0;
	transform: scale(0.9);
}

.root {
	position: absolute;
	width: 300px;
	overflow: clip;
	transform-origin: center top;
}

.banner {
	height: 78px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;
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

.avatarBack {
	width: 100px;
	position: absolute;
	top: 28px;
	left: 0;
	right: 0;
	margin: 0 auto;
}

.avatar {
	display: block;
	position: absolute;
	top: 38px;
	left: 0;
	right: 0;
	margin: 0 auto;
	z-index: 2;
	width: 58px;
	height: 58px;
}

.title {
	position: relative;
	z-index: 3;
	display: block;
	padding: 8px 26px 16px 26px;
	margin-top: 16px;
	text-align: center;
}

.name {
	display: inline-block;
	font-weight: bold;
	word-break: break-all;
}

.username {
	display: block;
	font-size: 0.8em;
	opacity: 0.7;
}

.description {
	padding: 16px 26px;
	font-size: 0.8em;
	text-align: center;
	border-top: solid 1px var(--divider);
	border-bottom: solid 1px var(--divider);
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 5;
	-webkit-box-orient: vertical;  
	overflow: hidden;
}

.status {
	padding: 16px 26px 16px 26px;
}

.statusItem {
	display: inline-block;
	width: 33%;
	text-align: center;

	> div {
		> i {
			display: block;
			margin: 0 auto;
		}
	}
}

.statusItemLabel {
	font-size: 0.7em;
	color: var(--fgTransparentWeak);
}

.menu {
	position: absolute;
	top: 8px;
	right: 44px;
	padding: 6px;
	background: var(--panel);
	border-radius: 999px;
}

.follow {
	position: absolute !important;
	top: 8px;
	right: 8px;
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
