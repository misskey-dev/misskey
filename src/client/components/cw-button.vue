<template>
<button class="nrvgflfu _button" @click="toggle">
	<b>{{ value ? $ts._cw.hide : $ts._cw.show }}</b>
	<span v-if="!value">{{ label }}</span>
</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { length } from 'stringz';
import { concat } from '../../prelude/array';

export default defineComponent({
	props: {
		value: {
			type: Boolean,
			required: true
		},
		note: {
			type: Object,
			required: true
		}
	},

	computed: {
		label(): string {
			return concat([
				this.note.text ? [this.$t('_cw.chars', { count: length(this.note.text) })] : [],
				this.note.files && this.note.files.length !== 0 ? [this.$t('_cw.files', { count: this.note.files.length }) ] : [],
				this.note.poll != null ? [this.$ts.poll] : []
			] as string[][]).join(' / ');
		}
	},

	methods: {
		length,

		toggle() {
			this.$emit('update:value', !this.value);
		}
	}
});
</script>

<style lang="scss" scoped>
.nrvgflfu {
	display: inline-block;
	padding: 4px 8px;
	font-size: 0.7em;
	color: var(--cwFg);
	background: var(--cwBg);
	border-radius: 2px;

	&:hover {
		background: var(--cwHoverBg);
	}

	> span {
		margin-left: 4px;

		&:before {
			content: '(';
		}

		&:after {
			content: ')';
		}
	}
}
</style>
