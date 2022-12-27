<template>
<transition :name="$store.state.animation ? 'popup' : ''" appear @after-leave="emit('closed')">
	<div v-if="showing" class="fxxzrfni _popup _shadow" :style="{ zIndex, top: top + 'px', left: left + 'px' }" @mouseover="() => { emit('mouseover'); }" @mouseleave="() => { emit('mouseleave'); }">
		<div v-if="user != null" class="info">
			<div class="banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''">
				<span v-if="$i && $i.id != user.id && user.isFollowed" class="followed">{{ $ts.followsYou }}</span>
			</div>
			<MkAvatar class="avatar" :user="user" :disable-preview="true" :show-indicator="true"/>
			<div class="title">
				<MkA class="name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
				<p class="username"><MkAcct :user="user"/></p>
			</div>
			<div class="description">
				<Mfm v-if="user.description" :text="user.description" :author="user" :i="$i" :custom-emojis="user.emojis"/>
			</div>
			<div class="status">
				<div>
					<p>{{ $ts.notes }}</p><span>{{ user.notesCount }}</span>
				</div>
				<div>
					<p>{{ $ts.following }}</p><span>{{ user.followingCount }}</span>
				</div>
				<div>
					<p>{{ $ts.followers }}</p><span>{{ user.followersCount }}</span>
				</div>
			</div>
			<MkFollowButton v-if="$i && user.id != $i.id" class="koudoku-button" :user="user" mini/>
		</div>
		<div v-else>
			<MkLoading/>
		</div>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import * as misskey from 'misskey-js';
import MkFollowButton from '@/components/MkFollowButton.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';

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
let user = $ref<misskey.entities.UserDetailed | null>(null);
let top = $ref(0);
let left = $ref(0);

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

<style lang="scss" scoped>
.popup-enter-active, .popup-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.popup-enter-from, .popup-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.fxxzrfni {
	position: absolute;
	width: 300px;
	overflow: hidden;
	transform-origin: center top;

	> .info {
		> .banner {
			height: 84px;
			background-color: rgba(0, 0, 0, 0.1);
			background-size: cover;
			background-position: center;
			> .followed {
					position: absolute;
					top: 12px;
					left: 12px;
					padding: 4px 8px;
					color: #fff;
					background: rgba(0, 0, 0, 0.7);
					font-size: 0.7em;
					border-radius: 6px;
			}
		}

		> .avatar {
			display: block;
			position: absolute;
			top: 62px;
			left: 13px;
			z-index: 2;
			width: 58px;
			height: 58px;
			border: solid 3px var(--face);
			border-radius: 8px;
		}

		> .title {
			display: block;
			padding: 8px 0 8px 82px;

			> .name {
				display: inline-block;
				margin: 0;
				font-weight: bold;
				line-height: 16px;
				word-break: break-all;
			}

			> .username {
				display: block;
				margin: 0;
				line-height: 16px;
				font-size: 0.8em;
				color: var(--fg);
				opacity: 0.7;
			}
		}

		> .description {
			padding: 0 16px;
			font-size: 0.8em;
			color: var(--fg);
		}

		> .status {
			padding: 8px 16px;

			> div {
				display: inline-block;
				width: 33%;

				> p {
					margin: 0;
					font-size: 0.7em;
					color: var(--fg);
				}

				> span {
					font-size: 1em;
					color: var(--accent);
				}
			}
		}

		> .koudoku-button {
			position: absolute;
			top: 8px;
			right: 8px;
		}
	}
}
</style>
