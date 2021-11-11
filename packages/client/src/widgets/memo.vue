<template>
<MkContainer :show-header="props.showHeader">
	<template #header><i class="fas fa-sticky-note"></i>{{ $ts._widgets.memo }}</template>

	<div class="otgbylcu">
		<textarea v-model="text" :placeholder="$ts.placeholder" @input="onChange"></textarea>
		<button @click="saveMemo" :disabled="!changed" class="_buttonPrimary">{{ $ts.save }}</button>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkContainer from '@/components/ui/container.vue';
import define from './define';
import * as os from '@/os';

const widget = define({
	name: 'memo',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer
	},

	data() {
		return {
			text: null,
			changed: false,
			timeoutId: null,
		};
	},

	created() {
		this.text = this.$store.state.memo;

		this.$watch(() => this.$store.reactiveState.memo, text => {
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
			this.$store.set('memo', this.text);
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
		color: var(--fg);
		background: transparent;
		border: none;
		border-bottom: solid 0.5px var(--divider);
		border-radius: 0;
		box-sizing: border-box;
		font: inherit;
		font-size: 0.9em;

		&:focus-visible {
			outline: none;
		}
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
