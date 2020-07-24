<template>
<mk-container :show-header="props.showHeader">
	<template #header><fa :icon="faStickyNote"/>{{ $t('_widgets.memo') }}</template>

	<div class="otgbylcu">
		<textarea v-model="text" :placeholder="$t('placeholder')" @input="onChange"></textarea>
		<button @click="saveMemo" :disabled="!changed" class="_buttonPrimary" v-t="'save'"></button>
	</div>
</mk-container>
</template>

<script lang="ts">
import { faStickyNote } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import define from './define';

export default define({
	name: 'memo',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
	})
}).extend({
	components: {
		MkContainer
	},

	data() {
		return {
			text: null,
			changed: false,
			timeoutId: null,
			faStickyNote
		};
	},

	created() {
		this.text = this.$store.state.settings.memo;

		this.$watch('$store.state.settings.memo', text => {
			this.text = text;
		});
	},

	methods: {
		onChange() {
			this.changed = true;
			clearTimeout(this.timeoutId);
			this.timeoutId = setTimeout(this.saveMemo, 1000);
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

<style lang="scss" scoped>
.otgbylcu {
	padding-bottom: 28px + 16px;

	> textarea {
		display: block;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		padding: 16px;
		color: var(--inputText);
		background: var(--face);
		border: none;
		border-bottom: solid var(--lineWidth) var(--faceDivider);
		border-radius: 0;
		box-sizing: border-box;
	}

	> button {
		display: block;
		position: absolute;
		bottom: 8px;
		right: 8px;
		margin: 0;
		padding: 0 10px;
		height: 28px;
		outline: none;
		border-radius: 4px;

		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}
}
</style>
