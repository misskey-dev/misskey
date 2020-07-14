<template>
<div class="wgwfgvvimdjvhjfwxropcwksnzftjqes">
	<div class="banner" :style="{ backgroundImage: banner ? `url(${banner})` : null }"></div>

	<div>
		<img svg-inline src="../../../../assets/title.svg" alt="Misskey">
		<p class="host">{{ host }}</p>
		<div class="about">
			<h2>{{ name || 'Misskey' }}</h2>
			<p v-html="description || this.$t('@.about')"></p>
		</div>
		<div class="signin">
			<a href="/signin" @click.prevent="signin()">{{ $t('@.signin') }}</a>
		</div>
		<div class="tl">
			<mk-welcome-timeline/>
		</div>
		<div class="hashtags">
			<mk-tag-cloud/>
		</div>
		<div class="photos">
			<div v-for="photo in photos" :style="`background-image: url(${photo.thumbnailUrl})`"></div>
		</div>
		<div class="stats" v-if="stats">
			<span><fa icon="user"/> {{ stats.originalUsersCount | number }}</span>
			<span><fa icon="pencil-alt"/> {{ stats.originalNotesCount | number }}</span>
		</div>
		<div class="announcements" v-if="announcements && announcements.length > 0">
			<article v-for="announcement in announcements">
				<span class="title" v-html="announcement.title"></span>
				<mfm :text="announcement.text"/>
				<img v-if="announcement.image" :src="announcement.image" alt="" style="display: block; max-height: 120px; max-width: 100%;"/>
			</article>
		</div>
		<article class="about-misskey">
			<h1>{{ $t('@.intro.title') }}</h1>
			<p v-html="this.$t('@.intro.about')"></p>
			<section>
				<h2>{{ $t('@.intro.features') }}</h2>
				<section>
					<h3>{{ $t('@.intro.rich-contents') }}</h3>
					<div class="image"><img src="/assets/about/post.png" alt=""></div>
					<p v-html="this.$t('@.intro.rich-contents-desc')"></p>
				</section>
				<section>
					<h3>{{ $t('@.intro.reaction') }}</h3>
					<div class="image"><img src="/assets/about/reaction.png" alt=""></div>
					<p v-html="this.$t('@.intro.reaction-desc')"></p>
				</section>
				<section>
					<h3>{{ $t('@.intro.ui') }}</h3>
					<div class="image"><img src="/assets/about/ui.png" alt=""></div>
					<p v-html="this.$t('@.intro.ui-desc')"></p>
				</section>
				<section>
					<h3>{{ $t('@.intro.drive') }}</h3>
					<div class="image"><img src="/assets/about/drive.png" alt=""></div>
					<p v-html="this.$t('@.intro.drive-desc')"></p>
				</section>
			</section>
			<p v-html="this.$t('@.intro.outro')"></p>
		</article>
		<div class="info" v-if="meta">
			<p>Version: <b>{{ meta.version }}</b></p>
			<p>Maintainer: <b><a :href="'mailto:' + meta.maintainerEmail" target="_blank">{{ meta.maintainerName }}</a></b></p>
		</div>
		<footer>
			<small>{{ copyright }}</small>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { copyright, host } from '../../../config';
import { concat } from '../../../../../prelude/array';
import { toUnicode } from 'punycode';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/welcome.vue'),
	data() {
		return {
			meta: null,
			copyright,
			stats: null,
			banner: null,
			host: toUnicode(host),
			name: null,
			description: '',
			photos: [],
			announcements: []
		};
	},
	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
			this.name = meta.name;
			this.description = meta.description;
			this.announcements = meta.announcements;
			this.banner = meta.bannerUrl;
		});

		this.$root.api('stats').then(stats => {
			this.stats = stats;
		});

		const image = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/apng',
			'image/vnd.mozilla.apng',
		];

		this.$root.api('notes/local-timeline', {
			fileType: image,
			excludeNsfw: true,
			limit: 6
		}).then((notes: any[]) => {
			const files = concat(notes.map((n: any): any[] => n.files));
			this.photos = files.filter(f => image.includes(f.type)).slice(0, 6);
		});
	},
	methods: {
		signin() {
			this.$root.dialog({
				type: 'signin'
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.wgwfgvvimdjvhjfwxropcwksnzftjqes
	text-align center

	> .banner
		position absolute
		top 0
		left 0
		width 100%
		height 300px
		background-position center
		background-size cover
		opacity 0.7

		&:after
			content ""
			display block
			position absolute
			bottom 0
			left 0
			width 100%
			height 100px
			background linear-gradient(transparent, var(--bg))

	> div:not(.banner)
		padding 32px
		margin 0 auto
		max-width 500px

		> svg
			display block
			width 200px
			height 50px
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
			color var(--text)
			background var(--face)
			border-radius 6px

			> h2
				margin 0

			> p
				margin 8px

		> .signin
			margin 16px 0

		> .tl
			margin 16px 0

			> *
				max-height 300px
				border-radius 6px
				overflow auto
				-webkit-overflow-scrolling touch

		> .hashtags
			padding 0 8px
			height 200px

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
			color var(--text)
			background rgba(#000, 0.1)
			border-radius 6px

			> *
				margin 0 8px

		> .announcements
			margin 16px 0

			> article
				background var(--mobileAnnouncement)
				border-radius 6px
				color var(--mobileAnnouncementFg)
				padding 16px
				margin 8px 0
				font-size 12px

				> .title
					font-weight bold

		> .about-misskey
			margin 16px 0
			padding 32px
			font-size 14px
			background var(--face)
			border-radius 6px
			overflow hidden
			color var(--text)

			> h1
				margin 0

				& + p
					margin-top 8px

			> p:last-child
				margin-bottom 0

			> section
				> h2
					border-bottom 1px solid var(--faceDivider)

				> section
					margin-bottom 16px
					padding-bottom 16px
					border-bottom 1px solid var(--faceDivider)

					> h3
						margin-bottom 8px

					> p
						margin-bottom 0

					> .image
						> img
							display block
							width 100%
							height 120px
							object-fit cover

		> .info
			padding 16px 0
			border solid 2px rgba(0, 0, 0, 0.1)
			border-radius 8px
			color var(--text)

			> *
				margin 0 16px

		> footer
			text-align center
			color var(--text)

			> small
				display block
				margin 16px 0 0 0
				opacity 0.7

</style>
