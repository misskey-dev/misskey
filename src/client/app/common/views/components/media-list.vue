<template>
<div class="mk-media-list">
	<template v-for="media in mediaList">
		<mk-media-banner :media="media" :key="media.id" v-if="!media.type.startsWith('image') && !media.type.startsWith('video')"/>
	</template>
	<div class="mk-media-list-fixed" v-if="mediaList.filter(media => media.type.startsWith('image') || media.type.startsWith('video')).length > 0">
		<div :data-count="mediaList.filter(media => media.type.startsWith('video') || media.type.startsWith('image')).length" ref="grid">
			<template v-for="media in mediaList">
				<mk-media-video :video="media" :key="media.id" v-if="media.type.startsWith('video')"/>
				<mk-media-image :image="media" :key="media.id" v-else-if="media.type.startsWith('image')" :raw="raw"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		mediaList: {
			required: true
		},
		raw: {
			default: false
		}
	},
	mounted() {
		// for Safari bug
		this.$refs.grid.style.height = this.$refs.grid.clientHeight ? `${this.$refs.grid.clientHeight}px` : '128px';
	}
});
</script>

<style lang="stylus" scoped>
.mk-media-list
	> .mk-media-list-fixed
		width 100%
		margin-top 4px

		&:before
			content ''
			display block
			padding-top 56.25% // 16:9

		> div
			position absolute
			top 0
			right 0
			bottom 0
			left 0
			display grid
			grid-gap 4px

			> *
				overflow hidden
				border-radius 4px

			&[data-count="1"]
				grid-template-rows 1fr

			&[data-count="2"]
				grid-template-columns 1fr 1fr
				grid-template-rows 1fr

			&[data-count="3"]
				grid-template-columns 1fr 0.5fr
				grid-template-rows 1fr 1fr

				> *:nth-child(1)
					grid-row 1 / 3

				> *:nth-child(3)
					grid-column 2 / 3
					grid-row 2 / 3

			&[data-count="4"]
				grid-template-columns 1fr 1fr
				grid-template-rows 1fr 1fr

			> *:nth-child(1)
				grid-column 1 / 2
				grid-row 1 / 2

			> *:nth-child(2)
				grid-column 2 / 3
				grid-row 1 / 2

			> *:nth-child(3)
				grid-column 1 / 2
				grid-row 2 / 3

			> *:nth-child(4)
				grid-column 2 / 3
				grid-row 2 / 3

</style>
