<template>
<div class="mk-user-timeline">
	<mk-posts :posts="posts">
		<div class="init" v-if="fetching">
			%fa:spinner .pulse%%i18n:common.loading%
		</div>
		<div class="empty" v-if="!fetching && posts.length == 0">
			%fa:R comments%
			{{ withMedia ? '%i18n:mobile.tags.mk-user-timeline.no-posts-with-media%' : '%i18n:mobile.tags.mk-user-timeline.no-posts%' }}
		</div>
		<button v-if="canFetchMore" @click="more" :disabled="fetching" slot="tail">
			<span v-if="!fetching">%i18n:mobile.tags.mk-user-timeline.load-more%</span>
			<span v-if="fetching">%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</mk-posts>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user', 'withMedia'],
	data() {
		return {
			fetching: true,
			posts: []
		};
	},
	mounted() {
		this.$root.$data.os.api('users/posts', {
			user_id: this.user.id,
			with_media: this.withMedia
		}).then(posts => {
			this.fetching = false;
			this.posts = posts;
			this.$emit('loaded');
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-timeline
	max-width 600px
	margin 0 auto
</style>
