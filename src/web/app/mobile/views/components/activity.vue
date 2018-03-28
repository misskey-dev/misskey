<template>
<div class="mk-activity">
	<svg v-if="data" ref="canvas" viewBox="0 0 30 1" preserveAspectRatio="none">
		<g v-for="(d, i) in data">
			<rect width="0.8" :height="d.postsH"
				:x="i + 0.1" :y="1 - d.postsH - d.repliesH - d.repostsH"
				fill="#41ddde"/>
			<rect width="0.8" :height="d.repliesH"
				:x="i + 0.1" :y="1 - d.repliesH - d.repostsH"
				fill="#f7796c"/>
			<rect width="0.8" :height="d.repostsH"
				:x="i + 0.1" :y="1 - d.repostsH"
				fill="#a1de41"/>
			</g>
	</svg>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			data: [],
			peak: null
		};
	},
	mounted() {
		(this as any).api('aggregation/users/activity', {
			userId: this.user.id,
			limit: 30
		}).then(data => {
			data.forEach(d => d.total = d.posts + d.replies + d.reposts);
			this.peak = Math.max.apply(null, data.map(d => d.total));
			data.forEach(d => {
				d.postsH = d.posts / this.peak;
				d.repliesH = d.replies / this.peak;
				d.repostsH = d.reposts / this.peak;
			});
			data.reverse();
			this.data = data;
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-activity
	max-width 600px
	margin 0 auto

	> svg
		display block
		width 100%
		height 80px

		> rect
			transform-origin center

</style>
