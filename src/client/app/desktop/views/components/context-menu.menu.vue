<template>
<ul class="menu">
	<li v-for="(item, i) in menu" :class="item ? item.type : item === null ? 'divider' : null">
		<template v-if="item">
			<template v-if="item.type == null || item.type == 'item'">
				<p @click="click(item)"><i v-if="item.icon" :class="$style.icon"><fa :icon="item.icon"/></i>{{ item.text }}</p>
			</template>
			<template v-else-if="item.type == 'link'">
				<a :href="item.href" :target="item.target" @click="click(item)" :download="item.download"><i v-if="item.icon" :class="$style.icon"><fa :icon="item.icon"/></i>{{ item.text }}</a>
			</template>
			<template v-else-if="item.type == 'nest'">
				<p><i v-if="item.icon" :class="$style.icon"><fa :icon="item.icon"/></i>{{ item.text }}...<span class="caret"><fa icon="caret-right"/></span></p>
				<me-nu :menu="item.menu" @x="click"/>
			</template>
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
.menu
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
			border-top solid var(--lineWidth) var(--faceDivider)

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
					background var(--primary)

		> p, a
			display block
			z-index 1
			margin 0
			padding 0 32px 0 38px
			line-height $item-height
			color var(--text)
			text-decoration none
			cursor pointer

			&:hover
				text-decoration none

			*
				pointer-events none

		&:hover
			> p, a
				text-decoration none
				background var(--primary)
				color var(--primaryForeground)

		&:active
			> p, a
				text-decoration none
				background var(--primaryDarken10)
				color var(--primaryForeground)

	li > ul
		visibility hidden
		position absolute
		top 0
		left $width
		margin-top -($padding)
		width $width
		background var(--popupBg)
		border-radius 0 4px 4px 4px
		box-shadow 2px 2px 8px rgba(#000, 0.2)
		transition visibility 0s linear 0.2s

</style>

<style lang="stylus" module>
.icon
	display inline-block
	width 28px
	margin-left -28px
	text-align center
</style>

