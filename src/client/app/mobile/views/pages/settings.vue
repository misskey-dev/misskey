<template>
<mk-ui>
	<span slot="header">%fa:cog%%i18n:@settings%</span>
	<div :class="$style.content">
		<p v-html="'%i18n:!@signed-in-as%'.replace('{}', '<b>' + name + '</b>')"></p>
		<ul>
			<li><router-link to="./settings/profile">%fa:user%%i18n:@profile%%fa:angle-right%</router-link></li>
			<li><router-link to="./settings/twitter">%fa:B twitter%%i18n:@twitter%%fa:angle-right%</router-link></li>
			<li><router-link to="./settings/signin-history">%fa:sign-in-alt%%i18n:@signin-history%%fa:angle-right%</router-link></li>
		</ul>
		<ul>
			<li><a @click="signout">%fa:power-off%%i18n:@signout%</a></li>
		</ul>
		<p><small>ver {{ version }} ({{ codename }})</small></p>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import { version, codename } from '../../../config';

export default Vue.extend({
	data() {
		return {
			version,
			codename
		};
	},
	computed: {
		name(): string {
			return Vue.filter('userName')((this as any).os.i);
		}
	},
	mounted() {
		document.title = 'Misskey | %i18n:@settings%';
	},
	methods: {
		signout() {
			(this as any).os.signout();
		}
	}
});
</script>

<style lang="stylus" module>
.content

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
		border solid 1px rgba(0, 0, 0, 0.2)
		border-radius $radius

		> li
			display block
			border-bottom solid 1px #ddd

			&:hover
				background rgba(0, 0, 0, 0.1)

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
