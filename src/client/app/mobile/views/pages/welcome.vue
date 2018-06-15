<template>
<div class="welcome">
	<div>
		<img :src="$store.state.device.darkmode ? 'assets/title.dark.svg' : 'assets/title.light.svg'" alt="Misskey">
		<p class="host">{{ host }}</p>
		<div class="about">
			<h2>{{ name || 'unidentified' }}</h2>
			<p v-html="description || '%i18n:common.about%'"></p>
			<router-link class="signup" to="/signup">新規登録</router-link>
		</div>
		<div class="login">
			<mk-signin :with-avatar="false"/>
		</div>
		<div class="tl">
			<mk-welcome-timeline/>
		</div>
		<div class="stats" v-if="stats">
			<span>%fa:user% {{ stats.originalUsersCount | number }}</span>
			<span>%fa:pencil-alt% {{ stats.originalNotesCount | number }}</span>
		</div>
		<footer>
			<small>{{ copyright }}</small>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, copyright, host, name, description } from '../../../config';

export default Vue.extend({
	data() {
		return {
			apiUrl,
			copyright,
			stats: null,
			host,
			name,
			description
		};
	},
	created() {
		(this as any).api('stats').then(stats => {
			this.stats = stats;
		});
	}
});
</script>

<style lang="stylus" scoped>
.welcome
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
			> *
				max-height 300px
				border-radius 6px
				overflow auto
				-webkit-overflow-scrolling touch

		> .stats
			margin 16px 0
			padding 8px
			font-size 14px
			color #444
			background rgba(#000, 0.1)
			border-radius 6px

			> *
				margin 0 8px

		> footer
			text-align center
			color #444

			> small
				display block
				margin 16px 0 0 0
				opacity 0.7

</style>
