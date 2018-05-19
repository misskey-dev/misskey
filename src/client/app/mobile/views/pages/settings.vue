<template>
<mk-ui>
	<span slot="header">%fa:cog%%i18n:@settings%</span>
	<main>
		<p v-html="'%i18n:!@signed-in-as%'.replace('{}', '<b>' + name + '</b>')"></p>
		<div>
			<x-profile/>

			<md-card class="md-layout-item md-size-50 md-small-size-100">
				<md-card-header>
					<div class="md-title">%i18n:@design%</div>
				</md-card-header>

				<md-card-content>
					<div>
						<md-switch v-model="darkmode">%i18n:@dark-mode%</md-switch>
					</div>

					<div>
						<md-switch v-model="clientSettings.circleIcons" @change="onChangeCircleIcons">%i18n:@circle-icons%</md-switch>
					</div>
				</md-card-content>
			</md-card>
		</div>
		<p><small>ver {{ version }} ({{ codename }})</small></p>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import { version, codename } from '../../../config';

import XProfile from './settings/settings.profile.vue';

export default Vue.extend({
	components: {
		XProfile
	},

	data() {
		return {
			version,
			codename,
			darkmode: localStorage.getItem('darkmode') == 'true'
		};
	},

	computed: {
		name(): string {
			return Vue.filter('userName')((this as any).os.i);
		}
	},

	watch: {
		darkmode() {
			(this as any)._updateDarkmode_(this.darkmode);
		}
	},

	mounted() {
		document.title = 'Misskey | %i18n:@settings%';
	},

	methods: {
		signout() {
			(this as any).os.signout();
		},

		onChangeCircleIcons(v) {
			this.$store.dispatch('settings/set', {
				key: 'circleIcons',
				value: v
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	padding 0 16px

	> div
		> *
			margin-bottom 16px

	> p
		display block
		margin 24px
		text-align center
		color #cad2da

	> ul
		$radius = 8px

		display block
		margin 16px auto
		padding 0
		max-width 500px
		width calc(100% - 32px)
		list-style none
		background #fff
		border solid 1px rgba(#000, 0.2)
		border-radius $radius

		> li
			display block
			border-bottom solid 1px #ddd

			&:hover
				background rgba(#000, 0.1)

			&:first-child
				border-top-left-radius $radius
				border-top-right-radius $radius

			&:last-child
				border-bottom-left-radius $radius
				border-bottom-right-radius $radius
				border-bottom none

			> a
				$height = 48px

				display block
				position relative
				padding 0 16px
				line-height $height
				color #4d635e

				> [data-fa]:nth-of-type(1)
					margin-right 4px

				> [data-fa]:nth-of-type(2)
					display block
					position absolute
					top 0
					right 8px
					z-index 1
					padding 0 20px
					font-size 1.2em
					line-height $height

</style>
