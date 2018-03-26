<template>
<div class="mk-media-list">
	<mk-media-image v-for="media in mediaList" ref="media" :image="media" :key="media.id"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['mediaList'],
	mounted() {
		const tags = this.$refs.media as Vue[];

		if (this.mediaList.length == 1) {
			(this.$el.style as any).gridTemplateRows = '1fr';

			(tags[0].$el.style as any).gridColumn = '1 / 2';
			(tags[0].$el.style as any).gridRow = '1 / 2';
		} else if (this.mediaList.length == 2) {
			(this.$el.style as any).gridTemplateColumns = '1fr 1fr';
			(this.$el.style as any).gridTemplateRows = '1fr';

			(tags[0].$el.style as any).gridColumn = '1 / 2';
			(tags[0].$el.style as any).gridRow = '1 / 2';
			(tags[1].$el.style as any).gridColumn = '2 / 3';
			(tags[1].$el.style as any).gridRow = '1 / 2';
		} else if (this.mediaList.length == 3) {
			(this.$el.style as any).gridTemplateColumns = '1fr 0.5fr';
			(this.$el.style as any).gridTemplateRows = '1fr 1fr';

			(tags[0].$el.style as any).gridColumn = '1 / 2';
			(tags[0].$el.style as any).gridRow = '1 / 3';
			(tags[1].$el.style as any).gridColumn = '2 / 3';
			(tags[1].$el.style as any).gridRow = '1 / 2';
			(tags[2].$el.style as any).gridColumn = '2 / 3';
			(tags[2].$el.style as any).gridRow = '2 / 3';
		} else if (this.mediaList.length == 4) {
			(this.$el.style as any).gridTemplateColumns = '1fr 1fr';
			(this.$el.style as any).gridTemplateRows = '1fr 1fr';

			(tags[0].$el.style as any).gridColumn = '1 / 2';
			(tags[0].$el.style as any).gridRow = '1 / 2';
			(tags[1].$el.style as any).gridColumn = '2 / 3';
			(tags[1].$el.style as any).gridRow = '1 / 2';
			(tags[2].$el.style as any).gridColumn = '1 / 2';
			(tags[2].$el.style as any).gridRow = '2 / 3';
			(tags[3].$el.style as any).gridColumn = '2 / 3';
			(tags[3].$el.style as any).gridRow = '2 / 3';
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-media-list
	display grid
	grid-gap 4px
	height 256px

	@media (max-width 500px)
		height 192px
</style>
