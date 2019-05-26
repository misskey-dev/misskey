<template>
<div class="jtivnzhfwquxpsfidertopbmwmchmnmo">
	<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
	<p class="empty" v-else-if="tags.length == 0"><fa icon="exclamation-circle"/>{{ $t('empty') }}</p>
	<div v-else>
		<vue-word-cloud
				:words="tags.slice(0, 20).map(x => [x.tag, x.count])"
				:color="color"
				:spacing="1">
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
import i18n from '../../../i18n';
import * as VueWordCloud from 'vuewordcloud';

export default Vue.extend({
	i18n: i18n('common/views/components/tag-cloud.vue'),
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
			this.$root.api('hashtags/trend').then(tags => {
				this.tags = tags;
				this.fetching = false;
			});
		},
		color([, weight]) {
			const peak = Math.max.apply(null, this.tags.map(x => x.count));
			const w = weight / peak;

			if (w > 0.9) {
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
.jtivnzhfwquxpsfidertopbmwmchmnmo
	height 100%
	width 100%

	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> [data-icon]
			margin-right 4px

	> div
		height 100%
		width 100%

</style>
