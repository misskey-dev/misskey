<template>
<div class="jtivnzhfwquxpsfidertopbmwmchmnmo">
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<p class="empty" v-else-if="tags.length == 0">%fa:exclamation-circle%%i18n:@empty%</p>
	<div v-else>
		<vue-word-cloud
				:words="tags.map(x => [x.name, x.count])"
				:color="color"
				font-family="Roboto">
			<template slot-scope="{word, text, weight}">
				<div style="cursor: pointer;" :title="weight">
					{{ text }}
				</div>
			</template>
		</vue-word-cloud>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as VueWordCloud from 'vuewordcloud';

export default Vue.extend({
	components: {
		[VueWordCloud.name]: VueWordCloud
	},
	data() {
		return {
			tags: [],
			fetching: true,
			clock: null
		};
	},
	mounted() {
		this.fetch();
		this.clock = setInterval(this.fetch, 1000 * 60);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		fetch() {
			(this as any).api('aggregation/hashtags').then(tags => {
				this.tags = tags;
				this.fetching = false;
			});
		},
		color([, weight]) {
			const peak = Math.max.apply(null, this.tags.map(x => x.count));
			const w = weight / peak;

			if (w == 1) {
				return this.$store.state.device.darkmode ? '#ff4e69' : '#ff4e69';
			} else if (w > 0.5) {
				return this.$store.state.device.darkmode ? '#3bc4c7' : '#3bc4c7';
			} else {
				return this.$store.state.device.darkmode ? '#fff' : '#555';
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	height 100%
	width 100%

	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

	> div
		height 100%
		width 100%

.jtivnzhfwquxpsfidertopbmwmchmnmo[data-darkmode]
	root(true)

.jtivnzhfwquxpsfidertopbmwmchmnmo:not([data-darkmode])
	root(false)

</style>
