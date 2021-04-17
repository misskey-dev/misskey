<template>
<div class="_panel vjnjpkug">
	<div class="banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''"></div>
	<MkAvatar class="avatar" :user="user" :disable-preview="true" :show-indicator="true"/>
	<div class="title">
		<MkA class="name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
		<p class="username"><MkAcct :user="user"/></p>
	</div>
	<div class="description">
		<div class="mfm" v-if="user.description">
			<Mfm :text="user.description" :author="user" :i="$i" :custom-emojis="user.emojis"/>
		</div>
		<span v-else style="opacity: 0.7;">{{ $ts.noAccountDescription }}</span>
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
	<MkFollowButton class="koudoku-button" v-if="$i && user.id != $i.id" :user="user" mini/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import parseAcct from '@/misc/acct/parse';
import MkFollowButton from './follow-button.vue';
import { userPage } from '../filters/user';

export default defineComponent({
	components: {
		MkFollowButton
	},

	props: {
		user: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
		};
	},

	methods: {
		userPage,
		parseAcct,
	}
});
</script>

<style lang="scss" scoped>
.vjnjpkug {
	position: relative;

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
		border: solid 4px var(--panel);
	}

	> .title {
		display: block;
		padding: 10px 0 10px 88px;

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
		padding: 16px;
		font-size: 0.8em;
		border-top: solid 0.5px var(--divider);

		> .mfm {
			display: -webkit-box;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;  
			overflow: hidden;
		}
	}

	> .status {
		padding: 10px 16px;
		border-top: solid 0.5px var(--divider);

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
</style>
