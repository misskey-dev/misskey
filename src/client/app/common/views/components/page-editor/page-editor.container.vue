<template>
<div class="cpjygsrt" :class="{ error: error != null, warn: warn != null }">
	<header>
		<div class="title"><slot name="header"></slot></div>
		<div class="buttons">
			<slot name="func"></slot>
			<button v-if="removable" @click="remove()">
				<fa :icon="faTrashAlt"/>
			</button>
			<button @click="toggleContent(!showBody)">
				<template v-if="showBody"><fa icon="angle-up"/></template>
				<template v-else><fa icon="angle-down"/></template>
			</button>
		</div>
	</header>
	<p v-show="showBody" class="error" v-if="error != null">{{ $t('script.typeError', { slot: error.arg + 1, expect: $t(`script.types.${error.expect}`), actual: $t(`script.types.${error.actual}`) }) }}</p>
	<p v-show="showBody" class="warn" v-if="warn != null">{{ $t('script.thereIsEmptySlot', { slot: warn.slot + 1 }) }}</p>
	<div v-show="showBody">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('pages'),

	props: {
		expanded: {
			type: Boolean,
			default: true
		},
		removable: {
			type: Boolean,
			default: true
		},
		error: {
			required: false,
			default: null
		},
		warn: {
			required: false,
			default: null
		}
	},
	data() {
		return {
			showBody: this.expanded,
			faTrashAlt
		};
	},
	methods: {
		toggleContent(show: boolean) {
			this.showBody = show;
			this.$emit('toggle', show);
		},
		remove() {
			this.$emit('remove');
		}
	}
});
</script>

<style lang="stylus" scoped>
.cpjygsrt
	overflow hidden
	background var(--face)
	border solid 2px rgba(#000, 0.1)
	border-radius 6px

	&:hover
		border solid 2px rgba(#000, 0.15)

	&.warn
		border solid 2px #dec44c

	&.error
		border solid 2px #f00

	& + .cpjygsrt
		margin-top 16px

	> header
		background var(--faceHeader)

		> .title
			z-index 1
			margin 0
			padding 0 16px
			line-height 42px
			font-size 0.9em
			font-weight bold
			color var(--faceHeaderText)
			box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

			> [data-icon]
				margin-right 6px

			&:empty
				display none

		> .buttons
			position absolute
			z-index 2
			top 0
			right 0

			> button
				padding 0
				width 42px
				font-size 0.9em
				line-height 42px
				color var(--faceTextButton)

				&:hover
					color var(--faceTextButtonHover)

				&:active
					color var(--faceTextButtonActive)

	> .warn
		color #b19e49
		margin 0
		padding 16px 16px 0 16px

	> .error
		color #f00
		margin 0
		padding 16px 16px 0 16px

</style>
