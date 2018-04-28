<template>
<ul class="menu">
	<li v-for="(item, i) in menu" :class="item.type">
		<template v-if="item.type == 'item'">
			<p @click="click(item)"><span :class="$style.icon" v-if="item.icon" v-html="item.icon"></span>{{ item.text }}</p>
		</template>
		<template v-if="item.type == 'link'">
			<a :href="item.href" :target="item.target" @click="click(item)"><span :class="$style.icon" v-if="item.icon" v-html="item.icon"></span>{{ item.text }}</a>
		</template>
		<template v-else-if="item.type == 'nest'">
			<p><span :class="$style.icon" v-if="item.icon" v-html="item.icon"></span>{{ item.text }}...<span class="caret">%fa:caret-right%</span></p>
			<me-nu :menu="item.menu" @x="click"/>
		</template>
	</li>
</ul>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	name: 'me-nu',
	props: ['menu'],
	methods: {
		click(item) {
			this.$emit('x', item);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	$width = 240px
	$item-height = 38px
	$padding = 10px

	margin 0
	padding $padding 0
	list-style none

	li
		display block

		&.divider
			margin-top $padding
			padding-top $padding
			border-top solid 1px isDark ? #1c2023 : #eee

		&.nest
			> p
				cursor default

				> .caret
					position absolute
					top 0
					right 8px

					> *
						line-height $item-height
						width 28px
						text-align center

			&:hover > ul
				visibility visible

			&:active
				> p, a
					background $theme-color

		> p, a
			display block
			z-index 1
			margin 0
			padding 0 32px 0 38px
			line-height $item-height
			color isDark ? #c8cece : #868C8C
			text-decoration none
			cursor pointer

			&:hover
				text-decoration none

			*
				pointer-events none

		&:hover
			> p, a
				text-decoration none
				background $theme-color
				color $theme-color-foreground

		&:active
			> p, a
				text-decoration none
				background darken($theme-color, 10%)
				color $theme-color-foreground

	li > ul
		visibility hidden
		position absolute
		top 0
		left $width
		margin-top -($padding)
		width $width
		background isDark ? #282c37 :#fff
		border-radius 0 4px 4px 4px
		box-shadow 2px 2px 8px rgba(#000, 0.2)
		transition visibility 0s linear 0.2s

.menu[data-darkmode]
	root(true)

.menu:not([data-darkmode])
	root(false)

</style>

<style lang="stylus" module>
.icon
	> *
		width 28px
		margin-left -28px
		text-align center
</style>

