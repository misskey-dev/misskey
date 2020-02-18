<template>
<div class="mk-welcome">
	<div class="banner" :style="{ backgroundImage: banner ? `url(${banner})` : null }"></div>

	<button @click="dark">
		<template v-if="$store.state.device.darkmode"><fa icon="moon"/></template>
		<template v-else><fa :icon="['far', 'moon']"/></template>
	</button>

	<mk-forkit class="forkit"/>

	<main>
		<div class="body">
			<div class="main block">
				<div>
					<h1 v-if="name != null && name != ''">{{ name }}</h1>
					<h1 v-else><img svg-inline src="../../../../assets/title.svg" alt="Misskey"></h1>

					<div class="info">
						<span><b>{{ host }}</b> - Powered by <b><a href="https://github.com/RinShibuya/misskey-v11-front">misskey-v11-front</a></b></span>
						<span></span>
						<span class="stats" v-if="stats">
							<span><fa icon="user"/> {{ stats.originalUsersCount | number }}</span>
							<span><fa icon="pencil-alt"/> {{ stats.originalNotesCount | number }}</span>
						</span>
					</div>

					<div class="desc">
						<span class="desc">misskey-v11-front は、Misskey v11 のフロントエンドを Misskey 本体から切り離し、単独でどのインスタンスでも動くようにした物です。Misskeyについてはここをクリック→</span>
						<a class="about" @click="about">{{ $t('about') }}</a>
					</div>

					<p class="sign">
						<span class="signin" @click="signin">{{ $t('@.signin') }}</span>
					</p>

					<img v-if="meta" :src="meta.mascotImageUrl" alt="" title="藍" class="char">
				</div>
			</div>

			<div class="announcements block">
				<header><fa icon="broadcast-tower"/> {{ $t('announcements') }}</header>
				<div v-if="announcements && announcements.length > 0">
					<div v-for="announcement in announcements">
						<h1 v-html="announcement.title"></h1>
						<mfm :text="announcement.text"/>
						<img v-if="announcement.image" :src="announcement.image" alt="" style="display: block; max-height: 130px; max-width: 100%;"/>
					</div>
				</div>
			</div>

			<div class="photos block">
				<header><fa :icon="['far', 'images']"/> {{ $t('photos') }}</header>
				<div>
					<div v-for="photo in photos" :style="`background-image: url(${photo.thumbnailUrl})`"></div>
				</div>
			</div>

			<div class="tag-cloud block">
				<div>
					<mk-tag-cloud/>
				</div>
			</div>

			<div class="nav block">
				<div>
					<mk-nav class="nav"/>
				</div>
			</div>

			<div class="side">
				<div class="trends block">
					<div>
						<mk-trends/>
					</div>
				</div>

				<div class="tl block">
					<header><fa :icon="['far', 'comment-alt']"/> {{ $t('timeline') }}</header>
					<div>
						<mk-welcome-timeline class="tl" :max="20"/>
					</div>
				</div>

				<div class="info block">
					<header><fa icon="info-circle"/> {{ $t('info') }}</header>
					<div>
						<div v-if="meta" class="body">
							<p>Version: <b>{{ meta.version }}</b></p>
							<p>Maintainer: <b><a :href="'mailto:' + meta.maintainerEmail" target="_blank">{{ meta.maintainerName }}</a></b></p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>

	<modal name="about" class="about modal" width="800px" height="auto" scrollable>
		<article class="fpdezooorhntlzyeszemrsqdlgbysvxq">
			<h1>{{ $t('@.intro.title') }}</h1>
			<p v-html="this.$t('@.intro.about')"></p>
			<section>
				<h2>{{ $t('@.intro.features') }}</h2>
				<section>
					<div class="body">
						<h3>{{ $t('@.intro.rich-contents') }}</h3>
						<p v-html="this.$t('@.intro.rich-contents-desc')"></p>
					</div>
					<div class="image"><img src="/assets/about/post.png" alt=""></div>
				</section>
				<section>
					<div class="body">
						<h3>{{ $t('@.intro.reaction') }}</h3>
						<p v-html="this.$t('@.intro.reaction-desc')"></p>
					</div>
					<div class="image"><img src="/assets/about/reaction.png" alt=""></div>
				</section>
				<section>
					<div class="body">
						<h3>{{ $t('@.intro.ui') }}</h3>
						<p v-html="this.$t('@.intro.ui-desc')"></p>
					</div>
					<div class="image"><img src="/assets/about/ui.png" alt=""></div>
				</section>
				<section>
					<div class="body">
						<h3>{{ $t('@.intro.drive') }}</h3>
						<p v-html="this.$t('@.intro.drive-desc')"></p>
					</div>
					<div class="image"><img src="/assets/about/drive.png" alt=""></div>
				</section>
			</section>
			<p v-html="this.$t('@.intro.outro')"></p>
		</article>
	</modal>

	<modal name="signin" class="modal" width="450px" height="auto" scrollable>
		<header class="formHeader">{{ $t('@.signin') }}</header>
		<mk-signin class="form"/>
	</modal>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { instanceHost , copyright } from '../../../config';
import { concat } from '../../../../../prelude/array';
import { toUnicode } from 'punycode';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/welcome.vue'),
	data() {
		return {
			meta: null,
			stats: null,
			banner: null,
			copyright,
			host: toUnicode(instanceHost),
			name: null,
			description: '',
			announcements: [],
			photos: []
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
		about() {
			this.$modal.show('about');
		},

		signin() {
			this.$modal.show('signin');
		},

		dark() {
			this.$store.commit('device/set', {
				key: 'darkmode',
				value: !this.$store.state.device.darkmode
			});
		}
	}
});
</script>

<style lang="stylus">
#wait
	right auto
	left 15px

.v--modal-overlay
	background rgba(0, 0, 0, 0.6)

.modal
	.form
		padding 24px 48px 48px 48px

	.formHeader
		text-align center
		padding 48px 0 12px 0
		margin 0 48px
		font-size 1.5em

	.v--modal-box
		background var(--face)
		color var(--text)

		.formHeader
			border-bottom solid 1px rgba(#000, 0.2)

.v--modal-overlay.about
	.v--modal-box.v--modal
		margin 32px 0

.fpdezooorhntlzyeszemrsqdlgbysvxq
	padding 64px

	> p:last-child
		margin-bottom 0

	> h1
		margin-top 0

	> section
		> h2
			border-bottom 1px solid var(--faceDivider)

		> section
			display grid
			grid-template-rows 1fr
			grid-template-columns 180px 1fr
			gap 32px
			margin-bottom 32px
			padding-bottom 32px
			border-bottom 1px solid var(--faceDivider)

			&:nth-child(odd)
				grid-template-columns 1fr 180px

				> .body
					grid-column 1

				> .image
					grid-column 2

			> .body
				grid-row 1
				grid-column 2

			> .image
				grid-row 1
				grid-column 1

				> img
					display block
					width 100%
					height 100%
					object-fit cover
</style>

<style lang="stylus" scoped>
.mk-welcome
	display flex
	min-height 100vh

	> .banner
		position absolute
		top 0
		left 0
		width 100%
		height 400px
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

	> .forkit
		position absolute
		top 0
		right 0

	> button
		position fixed
		z-index 1
		bottom 16px
		left 16px
		padding 16px
		font-size 18px
		color var(--text)

	> main
		margin 0 auto
		padding 64px
		width 100%
		max-width 1200px

		.block
			color var(--text)
			background var(--face)
			overflow auto

			> header
				z-index 1
				padding 0 16px
				line-height 48px
				background var(--faceHeader)
				box-shadow 0 1px 0 rgba(0, 0, 0, 0.1)

				& + div
					max-height calc(100% - 48px)

			> div
				overflow auto

		> .body
			display grid
			grid-template-rows 390px 1fr 256px 64px
			grid-template-columns 1fr 1fr 350px
			gap 16px
			height 1150px

			> .main
				grid-row 1
				grid-column 1 / 3

				> div
					padding 32px
					min-height 100%

					> h1
						margin 0

						> svg
							margin -8px 0 0 -16px
							width 280px
							height 100px
							fill currentColor

					> .info
						margin 0 auto 16px auto
						width $width
						font-size 14px

						> .stats
							margin-left 16px
							padding-left 16px
							border-left solid 1px var(--faceDivider)

							> *
								margin-right 16px

					> .desc
						max-width calc(100% - 150px)

					> .sign
						font-size 120%
						margin-bottom 0

						> .divider
							margin 0 16px

						> .signin
							cursor pointer

							&:hover
								color var(--primary)

					> .char
						display block
						position absolute
						right 16px
						bottom 0
						height 320px
						opacity 0.7

					> *:not(.char)
						z-index 1

			> .announcements
				grid-row 2
				grid-column 1

				> div
					padding 32px

					> div
						padding 0 0 16px 0
						margin 0 0 16px 0
						border-bottom 1px solid var(--faceDivider)

						> h1
							margin 0
							font-size 1.25em

			> .photos
				grid-row 2
				grid-column 2

				> div
					display grid
					grid-template-rows 1fr 1fr 1fr
					grid-template-columns 1fr 1fr
					gap 8px
					height 100%
					padding 16px

					> div
						//border-radius 4px
						background-position center center
						background-size cover

			> .tag-cloud
				grid-row 3
				grid-column 1 / 3

				> div
					height 256px
					padding 32px

			> .nav
				display flex
				justify-content center
				align-items center
				grid-row 4
				grid-column 1 / 3
				font-size 14px

			> .side
				display grid
				grid-row 1 / 5
				grid-column 3
				grid-template-rows 1fr 350px
				grid-template-columns 1fr
				gap 16px

				> .tl
					grid-row 1
					grid-column 1
					overflow auto

				> .trends
					grid-row 2
					grid-column 1
					padding 8px

				> .info
					grid-row 3
					grid-column 1

					> div
						padding 16px

						> .body
							> p
								display block
								margin 0

</style>
