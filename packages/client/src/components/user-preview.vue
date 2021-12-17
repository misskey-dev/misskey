<template>
<transition name="popup" appear @after-leave="$emit('closed')">
	<div v-if="showing" class="fxxzrfni _popup _shadow" :style="{ zIndex, top: top + 'px', left: left + 'px' }" @mouseover="() => { $emit('mouseover'); }" @mouseleave="() => { $emit('mouseleave'); }">
		<div v-if="fetched" class="info">
			<div class="banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''"></div>
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

<script lang="ts">
import { defineComponent } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import MkFollowButton from './follow-button.vue';
import { userPage } from '@/filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkFollowButton
	},

	props: {
		showing: {
			type: Boolean,
			required: true
		},
		q: {
			type: String,
			required: true
		},
		source: {
			required: true
		}
	},

	emits: ['closed', 'mouseover', 'mouseleave'],

	data() {
		return {
			user: null,
			fetched: false,
			top: 0,
			left: 0,
			zIndex: os.claimZIndex(),
		};
	},

	mounted() {
		if (typeof this.q == 'object') {
			this.user = this.q;
			this.fetched = true;
		} else {
			const query = this.q.startsWith('@') ?
				Acct.parse(this.q.substr(1)) :
				{ userId: this.q };

			os.api('users/show', query).then(user => {
				if (!this.showing) return;
				this.user = user;
				this.fetched = true;
			});
		}

		const rect = this.source.getBoundingClientRect();
		const x = ((rect.left + (this.source.offsetWidth / 2)) - (300 / 2)) + window.pageXOffset;
		const y = rect.top + this.source.offsetHeight + window.pageYOffset;

		this.top = y;
		this.left = x;
	},

	methods: {
		userPage
	}
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
