<template>
<div class="vhpxefrj" tabindex="-1" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
	<router-link :to="`/@${page.user.username}/pages/${page.name}`">
		<div class="thumbnail" v-if="page.eyeCatchingImage" :style="`background-image: url('${page.eyeCatchingImage.thumbnailUrl}')`"></div>
		<article>
			<header>
				<h1 :title="page.title">{{ page.title }}</h1>
			</header>
			<p v-if="description" :title="description">{{ description.length > 85 ? description.slice(0, 85) + '…' : description }}</p>
			<footer>
				<img class="icon" v-if="icon" :src="icon"/>
				<p>{{ page.user | userName }}</p>
			</footer>
		</article>
	</router-link>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		page: {
			type: Object,
			required: true
		},
	},
});
</script>

<style lang="stylus" scoped>
.vhpxefrj
	overflow hidden
	width 100%
	background var(--face)

	&.round
		border-radius 8px

	&.shadow
		box-shadow 0 4px 16px rgba(#000, 0.1)

		@media (min-width 500px)
			box-shadow 0 8px 32px rgba(#000, 0.1)

	> .thumbnail
		position absolute
		width 100px
		height 100%
		background-position center
		background-size cover
		display flex
		justify-content center
		align-items center

		> button
			font-size 3.5em
			opacity: 0.7

			&:hover
				font-size 4em
				opacity 0.9

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
				color var(--urlPreviewTitle)

		> p
			margin 0
			color var(--urlPreviewText)
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
				color var(--urlPreviewInfo)
				font-size 0.8em
				line-height 16px
				vertical-align top

	@media (max-width 700px)
		> .thumbnail
			position relative
			width 100%
			height 100px

			& + article
				left 0
				width 100%

	@media (max-width 550px)
		font-size 12px

		> .thumbnail
			height 80px

		> article
			padding 12px

	@media (max-width 500px)
		font-size 10px

		> .thumbnail
			height 70px

		> article
			padding 8px

			> header
				margin-bottom 4px

			> footer
				margin-top 4px

				> img
					width 12px
					height 12px

</style>
