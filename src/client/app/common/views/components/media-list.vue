<template>
<div class="mk-media-list">
	<div :data-count="mediaList.length">
		<template v-for="media in mediaList">
			<mk-media-video :video="media" :key="media.id" v-if="media.type.startsWith('video')" :inline-playable="mediaList.length === 1"/>
			<mk-media-image :image="media" :key="media.id" v-else :raw="raw"/>
		</template>
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
	}
});
</script>

<style lang="stylus" scoped>
.mk-media-list
	width 100%

	&:before
		content ''
		display block
		padding-top 56.25% // 16:9

	> div
		position absolute
		top 0
		left 0
		bottom 0
		right 0
		display grid
		grid-gap 4px

		&[data-count="1"]
			grid-template-rows 1fr
		&[data-count="2"]
			grid-template-columns 1fr 1fr
			grid-template-rows 1fr
		&[data-count="3"]
			grid-template-columns 1fr 0.5fr
			grid-template-rows 1fr 1fr
			:nth-child(1)
				grid-row 1 / 3
			:nth-child(3)
				grid-column 2 / 3
				grid-row 2/3
		&[data-count="4"]
			grid-template-columns 1fr 1fr
			grid-template-rows 1fr 1fr

		:nth-child(1)
			grid-column 1 / 2
			grid-row 1 / 2
		:nth-child(2)
			grid-column 2 / 3
			grid-row 1 / 2
		:nth-child(3)
			grid-column 1 / 2
			grid-row 2 / 3
		:nth-child(4)
			grid-column 2 / 3
			grid-row 2 / 3

</style>
