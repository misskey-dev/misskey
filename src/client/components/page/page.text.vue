<template>
<div class="mrdgzndn">
	<mfm :text="text" :is-note="false" :i="$store.state.i" :key="text"/>
	<MkUrlPreview v-for="url in urls" :url="url" :key="url" class="url"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { parse } from '../../../mfm/parse';
import { unique } from '../../../prelude/array';
import * as os from '@/os';

export default defineComponent({
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		}
	},
	data() {
		return {
			text: this.hpml.interpolate(this.value.text),
		};
	},
	computed: {
		urls(): string[] {
			if (this.text) {
				const ast = parse(this.text);
				// TODO: 再帰的にURL要素がないか調べる
				return unique(ast
					.filter(t => ((t.node.type == 'url' || t.node.type == 'link') && t.node.props.url && !t.node.props.silent))
					.map(t => t.node.props.url));
			} else {
				return [];
			}
		}
	},
	watch: {
		'hpml.vars': {
			handler() {
				this.text = this.hpml.interpolate(this.value.text);
			},
			deep: true
		}
	},
});
</script>

<style lang="scss" scoped>
.mrdgzndn {
	&:not(:first-child) {
		margin-top: 0.5em;
	}

	&:not(:last-child) {
		margin-bottom: 0.5em;
	}

	> .url {
		margin: 0.5em 0;
	}
}
</style>
