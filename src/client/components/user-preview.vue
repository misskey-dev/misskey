<template>
<transition name="popup" appear @after-leave="() => { $emit('closed'); destroyDom(); }">
	<div v-if="show" class="fxxzrfni _panel _shadow" ref="content" :style="{ top: top + 'px', left: left + 'px' }" @mouseover="() => { $emit('mouseover'); }" @mouseleave="() => { $emit('mouseleave'); }">
		<div class="banner" :style="u.bannerUrl ? `background-image: url(${u.bannerUrl})` : ''"></div>
		<mk-avatar class="avatar" :user="u" :disable-preview="true"/>
		<div class="title">
			<router-link class="name" :to="u | userPage"><mk-user-name :user="u" :nowrap="false"/></router-link>
			<p class="username"><mk-acct :user="u"/></p>
		</div>
		<div class="description">
			<mfm v-if="u.description" :text="u.description" :author="u" :i="$store.state.i" :custom-emojis="u.emojis"/>
		</div>
		<div class="status">
			<div>
				<p v-t="'notes'"></p><span>{{ u.notesCount }}</span>
			</div>
			<div>
				<p v-t="'following'"></p><span>{{ u.followingCount }}</span>
			</div>
			<div>
				<p v-t="'followers'"></p><span>{{ u.followersCount }}</span>
			</div>
		</div>
		<mk-follow-button class="koudoku-button" v-if="$store.getters.isSignedIn && u.id != $store.state.i.id" :user="u" mini/>
	</div>
</transition>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../misc/acct/parse';
import MkFollowButton from './follow-button.vue';

export default Vue.extend({
	components: {
		MkFollowButton
	},

	props: {
		user: {
			type: [Object, String],
			required: true
		},
		source: {
			required: true
		}
	},

	data() {
		return {
			u: null,
			show: false,
			closed: false,
			top: 0,
			left: 0,
		};
	},

	mounted() {
		if (typeof this.user == 'object') {
			this.u = this.user;
			this.show = true;
		} else {
			const query = this.user.startsWith('@') ?
				parseAcct(this.user.substr(1)) :
				{ userId: this.user };

			this.$root.api('users/show', query).then(user => {
				if (this.closed) return;
				this.u = user;
				this.show = true;
			});
		}

		const rect = this.source.getBoundingClientRect();
		const x = ((rect.left + (this.source.offsetWidth / 2)) - (300 / 2)) + window.pageXOffset;
		const y = rect.top + this.source.offsetHeight + window.pageYOffset;

		this.top = y;
		this.left = x;
	},

	methods: {
		close() {
			this.closed = true;
			this.show = false;
			if (this.$refs.content) (this.$refs.content as any).style.pointerEvents = 'none';
		}
	}
});
</script>

<style lang="scss" scoped>
.popup-enter-active, .popup-leave-active {
	transition: opacity 0.3s, transform 0.3s !important;
}
.popup-enter, .popup-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.fxxzrfni {
	position: absolute;
	z-index: 11000;
	width: 300px;
	overflow: hidden;

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
			color: var(--text);
			opacity: 0.7;
		}
	}

	> .description {
		padding: 0 16px;
		font-size: 0.8em;
		color: var(--text);
	}

	> .status {
		padding: 8px 16px;

		> div {
			display: inline-block;
			width: 33%;

			> p {
				margin: 0;
				font-size: 0.7em;
				color: var(--text);
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
</style>
