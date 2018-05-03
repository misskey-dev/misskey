<template>
<iframe v-if="youtubeId" type="text/html" height="250"
	:src="`https://www.youtube.com/embed/${youtubeId}?origin=${misskeyUrl}`"
	frameborder="0"/>
<div v-else class="mk-url-preview">
	<a :href="url" target="_blank" :title="url" v-if="!fetching">
		<div class="thumbnail" v-if="thumbnail" :style="`background-image: url(${thumbnail})`"></div>
		<article>
			<header>
				<h1>{{ title }}</h1>
			</header>
			<p>{{ description }}</p>
			<footer>
				<img class="icon" v-if="icon" :src="icon"/>
				<p>{{ sitename }}</p>
			</footer>
		</article>
	</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { url as misskeyUrl } from '../../../config';

export default Vue.extend({
	props: ['url'],
	data() {
		return {
			fetching: true,
			title: null,
			description: null,
			thumbnail: null,
			icon: null,
			sitename: null,
			youtubeId: null,
			misskeyUrl
		};
	},
	created() {
		const url = new URL(this.url);

		if (url.hostname == 'www.youtube.com') {
			this.youtubeId = url.searchParams.get('v');
		} else if (url.hostname == 'youtu.be') {
			this.youtubeId = url.pathname;
		} else {
			fetch('/url?url=' + this.url).then(res => {
				res.json().then(info => {
					this.title = info.title;
					this.description = info.description;
					this.thumbnail = info.thumbnail;
					this.icon = info.icon;
					this.sitename = info.sitename;

					this.fetching = false;
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
iframe
	width 100%

root(isDark)
	> a
		display block
		font-size 16px
		border solid 1px isDark ? #191b1f : #eee
		border-radius 4px
		overflow hidden

		&:hover
			text-decoration none
			border-color isDark ? #4f5561 : #ddd

			> article > header > h1
				text-decoration underline

		> .thumbnail
			position absolute
			width 100px
			height 100%
			background-position center
			background-size cover

			& + article
				left 100px
				width calc(100% - 100px)

		> article
			padding 16px

			> header
				margin-bottom 8px

				> h1
					margin 0
					font-size 1em
					color isDark ? #d6dae0 : #555

			> p
				margin 0
				color isDark ? #a4aab3 : #777
				font-size 0.8em

			> footer
				margin-top 8px
				height 16px

				> img
					display inline-block
					width 16px
					height 16px
					margin-right 4px
					vertical-align top

				> p
					display inline-block
					margin 0
					color isDark ? #b0b4bf : #666
					font-size 0.8em
					line-height 16px
					vertical-align top

		@media (max-width 500px)
			font-size 8px
			border none

			> .thumbnail
				width 70px

				& + article
					left 70px
					width calc(100% - 70px)

			> article
				padding 8px

.mk-url-preview[data-darkmode]
	root(true)

.mk-url-preview:not([data-darkmode])
	root(false)

</style>
