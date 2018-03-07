<template>
<div class="channel">
	<p v-if="fetching">読み込み中<mk-ellipsis/></p>
	<div v-if="!fetching" ref="posts" class="posts">
		<p v-if="posts.length == 0">まだ投稿がありません</p>
		<x-post class="post" v-for="post in posts.slice().reverse()" :post="post" :key="post.id" @reply="reply"/>
	</div>
	<x-form class="form" ref="form"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import ChannelStream from '../../../common/scripts/streaming/channel';
import XForm from './channel.channel.form.vue';
import XPost from './channel.channel.post.vue';

export default Vue.extend({
	components: {
		XForm,
		XPost
	},
	props: ['channel'],
	data() {
		return {
			fetching: true,
			posts: [],
			connection: null
		};
	},
	watch: {
		channel() {
			this.zap();
		}
	},
	mounted() {
		this.zap();
	},
	beforeDestroy() {
		this.disconnect();
	},
	methods: {
		zap() {
			this.fetching = true;

			(this as any).api('channels/posts', {
				channel_id: this.channel.id
			}).then(posts => {
				this.posts = posts;
				this.fetching = false;

				this.$nextTick(() => {
					this.scrollToBottom();
				});

				this.disconnect();
				this.connection = new ChannelStream(this.channel.id);
				this.connection.on('post', this.onPost);
			});
		},
		disconnect() {
			if (this.connection) {
				this.connection.off('post', this.onPost);
				this.connection.close();
			}
		},
		onPost(post) {
			this.posts.unshift(post);
			this.scrollToBottom();
		},
		scrollToBottom() {
			(this.$refs.posts as any).scrollTop = (this.$refs.posts as any).scrollHeight;
		},
		reply(post) {
			(this.$refs.form as any).text = `>>${ post.index } `;
		}
	}
});
</script>

<style lang="stylus" scoped>
.channel

	> p
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .posts
		height calc(100% - 38px)
		overflow auto
		font-size 0.9em

		> .post
			border-bottom solid 1px #eee

			&:last-child
				border-bottom none

	> .form
		position absolute
		left 0
		bottom 0

</style>
