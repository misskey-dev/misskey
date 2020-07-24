<template>
<mk-pagination :pagination="pagination" #default="{items}" class="mk-following-or-followers" ref="list">
	<div class="user _panel" v-for="(user, i) in items.map(x => type === 'following' ? x.followee : x.follower)" :key="user.id">
		<mk-avatar class="avatar" :user="user"/>
		<div class="body">
			<div class="name">
				<router-link class="name" :to="user | userPage" v-user-preview="user.id"><mk-user-name :user="user"/></router-link>
				<p class="acct">@{{ user | acct }}</p>
			</div>
			<div class="description" v-if="user.description" :title="user.description">
				<mfm :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis" :plain="true" :nowrap="true"/>
			</div>
			<mk-follow-button class="koudoku-button" v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" mini/>
		</div>
	</div>
</mk-pagination>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import parseAcct from '../../../misc/acct/parse';
import MkFollowButton from '../../components/follow-button.vue';
import MkPagination from '../../components/ui/pagination.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkFollowButton,
	},

	props: {
		type: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			pagination: {
				endpoint: () => this.type === 'following' ? 'users/following' : 'users/followers',
				limit: 20,
				params: {
					...parseAcct(this.$route.params.user),
				}
			},
		};
	},

	watch: {
		type() {
			this.$refs.list.reload();
		},

		'$route'() {
			this.$refs.list.reload();
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-following-or-followers {
	> .user {
		display: flex;
		padding: 16px;

		> .avatar {
			display: block;
			flex-shrink: 0;
			margin: 0 12px 0 0;
			width: 42px;
			height: 42px;
			border-radius: 8px;
		}

		> .body {
			display: flex;
			width: calc(100% - 54px);
			position: relative;

			> .name {
				width: 45%;

				@media (max-width: 500px) {
					width: 100%;
				}

				> .name,
				> .acct {
					display: block;
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
					margin: 0;
				}

				> .name {
					font-size: 16px;
					line-height: 24px;
				}

				> .acct {
					font-size: 15px;
					line-height: 16px;
					opacity: 0.7;
				}
			}

			> .description {
				width: 55%;
				line-height: 42px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				opacity: 0.7;
				font-size: 14px;
				padding-right: 40px;
				padding-left: 8px;
				box-sizing: border-box;

				@media (max-width: 500px) {
					display: none;
				}
			}

			> .koudoku-button {
				position: absolute;
				top: 0;
				bottom: 0;
				right: 0;
				margin: auto 0;
			}
		}
	}
}
</style>
