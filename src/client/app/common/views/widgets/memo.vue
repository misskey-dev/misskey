<template>
<div class="mkw-memo">
	<ui-container :show-header="!props.compact">
		<template slot="header"><fa :icon="['far', 'sticky-note']"/>{{ $t('title') }}</template>

		<div class="mkw-memo--body">
			<textarea v-model="text" :placeholder="$t('placeholder')" @input="onChange"></textarea>
			<button @click="saveMemo" :disabled="!changed">{{ $t('save') }}</button>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'memo',
	props: () => ({
		compact: false
	})
}).extend({
	i18n: i18n('common/views/widgets/memo.vue'),
	data() {
		return {
			text: null,
			changed: false
		};
	},

	created() {
		this.text = this.$store.state.settings.memo;

		this.$watch('$store.state.settings.memo', text => {
			this.text = text;
		});
	},

	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},

		onChange() {
			this.changed = true;
		},

		saveMemo() {
			this.$store.dispatch('settings/set', {
				key: 'memo',
				value: this.text
			});
			this.changed = false;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-memo
	.mkw-memo--body
		padding-bottom 28px + 16px

		> textarea
			display block
			width 100%
			max-width 100%
			min-width 100%
			padding 16px
			color var(--inputText)
			background var(--face)
			border none
			border-bottom solid var(--lineWidth) var(--faceDivider)
			border-radius 0

		> button
			display block
			position absolute
			bottom 8px
			right 8px
			margin 0
			padding 0 10px
			height 28px
			color var(--primaryForeground)
			background var(--primary) !important
			outline none
			border none
			border-radius 4px
			transition background 0.1s ease
			cursor pointer

			&:hover
				background var(--primaryLighten10) !important

			&:active
				background var(--primaryDarken10) !important
				transition background 0s ease

			&:disabled
				opacity 0.7
				cursor default

</style>
