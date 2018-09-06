<template>
<div class="wgwfgvvimdjvhjfwxropcwksnzftjqes">
	<div>
		<img :src="$store.state.device.darkmode ? 'assets/title.dark.svg' : 'assets/title.light.svg'" :alt="name">
		<p class="host">{{ host }}</p>
		<div class="about">
			<h2>{{ name }}</h2>
			<p v-html="description || '%i18n:common.about%'"></p>
			<router-link class="signup" to="/signup">%i18n:@signup%</router-link>
		</div>
		<div class="login">
			<mk-signin :with-avatar="false"/>
		</div>
		<div class="tl">
			<mk-welcome-timeline/>
		</div>
		<div class="hashtags">
			<router-link v-for="tag in tags" :key="tag" :to="`/tags/${ tag }`" :title="tag">#{{ tag }}</router-link>
		</div>
		<div class="photos">
			<div v-for="photo in photos" :style="`background-image: url(${photo.thumbnailUrl})`"></div>
		</div>
		<div class="stats" v-if="stats">
			<span>%fa:user% {{ stats.originalUsersCount | number }}</span>
			<span>%fa:pencil-alt% {{ stats.originalNotesCount | number }}</span>
		</div>
		<div class="announcements" v-if="announcements && announcements.length > 0">
			<article v-for="announcement in announcements">
				<span class="title" v-html="announcement.title"></span>
				<div v-html="announcement.text"></div>
			</article>
		</div>
		<footer>
			<small>{{ copyright }}</small>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, copyright, host } from '../../../config';
import { concat } from '../../../../../prelude/array';

export default Vue.extend({
	data() {
		return {
			apiUrl,
			copyright,
			stats: null,
			host,
			name: 'Misskey',
			description: '',
			tags: [],
			photos: [],
			announcements: []
		};
	},
	created() {
		(this as any).os.getMeta().then(meta => {
			this.name = meta.name;
			this.description = meta.description;
			this.announcements = meta.broadcasts;
		});

		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});

		(this as any).api('hashtags/trend').then(stats => {
			this.tags = stats.map(x => x.tag);
		});

		const image = [
			'image/jpeg',
			'image/png',
			'image/gif'
		];

		(this as any).api('notes/local-timeline', {
			fileType: image,
			limit: 6
		}).then((notes: any[]) => {
			const files = concat(notes.map((n: any): any[] => n.files));
			this.photos = files.filter(f => image.includes(f.type)).slice(0, 6);
		});
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	text-align center
	//background #fff

	> div
		padding 32px
		margin 0 auto
		max-width 500px

		> img
			display block
			max-width 200px
			margin 0 auto

		> .host
			display block
			text-align center
			padding 6px 12px
			line-height 32px
			font-weight bold
			color #333
			background rgba(#000, 0.035)
			border-radius 6px

		> .about
			margin-top 16px
			padding 16px
			color #555
			background #fff
			border-radius 6px

			> h2
				margin 0

			> p
				margin 8px

			> .signup
				font-weight bold

		> .login
			margin 16px 0

			> form

				button
					display block
					width 100%
					padding 10px
					margin 0
					color #333
					font-size 1em
					text-align center
					text-decoration none
					text-shadow 0 1px 0 rgba(255, 255, 255, 0.9)
					background-image linear-gradient(#fafafa, #eaeaea)
					border 1px solid #ddd
					border-bottom-color #cecece
					border-radius 4px

					&:active
						background-color #767676
						background-image none
						border-color #444
						box-shadow 0 1px 3px rgba(#000, 0.075), inset 0 0 5px rgba(#000, 0.2)

		> .tl
			margin 16px 0

			> *
				max-height 300px
				border-radius 6px
				overflow auto
				-webkit-overflow-scrolling touch

		> .hashtags
			padding 16px 0
			border solid 2px #ddd
			border-radius 8px

			> *
				margin 0 16px

		> .photos
			display grid
			grid-template-rows 1fr 1fr 1fr
			grid-template-columns 1fr 1fr
			gap 8px
			height 300px
			margin-top 16px

			> div
				border-radius 4px
				background-position center center
				background-size cover

		> .stats
			margin 16px 0
			padding 8px
			font-size 14px
			color #444
			background rgba(#000, 0.1)
			border-radius 6px

			> *
				margin 0 8px

		> .announcements
			margin 16px 0

			> article
				background isDark ? rgba(30, 129, 216, 0.2) : rgba(155, 196, 232, 0.2)
				border-radius 6px
				color isDark ? #fff : #3f4967
				padding 16px
				margin 8px 0
				font-size 12px

				> .title
					font-weight bold

		> footer
			text-align center
			color #444

			> small
				display block
				margin 16px 0 0 0
				opacity 0.7

.wgwfgvvimdjvhjfwxropcwksnzftjqes[data-darkmode]
	root(true)

.wgwfgvvimdjvhjfwxropcwksnzftjqes:not([data-darkmode])
	root(false)

</style>
