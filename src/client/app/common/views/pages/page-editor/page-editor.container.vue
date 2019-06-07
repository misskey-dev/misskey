<template>
<div class="cpjygsrt" :class="{ error: error != null, warn: warn != null }">
	<header>
		<div class="title"><slot name="header"></slot></div>
		<div class="buttons">
			<slot name="func"></slot>
			<button v-if="removable" @click="remove()">
				<fa :icon="faTrashAlt"/>
			</button>
			<button v-if="draggable" class="drag-handle">
				<fa :icon="faBars"/>
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
import { faBars } from '@fortawesome/free-solid-svg-icons';
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
		draggable: {
			type: Boolean,
			default: false
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
			faTrashAlt, faBars
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
	border solid 2px var(--pageBlockBorder)
	border-radius 6px

	&:hover
		border solid 2px var(--pageBlockBorderHover)

	&.warn
		border solid 2px #dec44c

	&.error
		border solid 2px #f00

	& + .cpjygsrt
		margin-top 16px

	> header
		> .title
			z-index 1
			margin 0
			padding 0 16px
			line-height 42px
			font-size 0.9em
			font-weight bold
			color var(--faceHeaderText)
			box-shadow 0 1px rgba(#000, 0.07)

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

			.drag-handle
				cursor move

	> .warn
		color #b19e49
		margin 0
		padding 16px 16px 0 16px
		font-size 14px

	> .error
		color #f00
		margin 0
		padding 16px 16px 0 16px
		font-size 14px

</style>
