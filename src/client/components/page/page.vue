<template>
<div class="iroscrza" :class="{ center: page.alignCenter, serif: page.font === 'serif' }" v-if="hpml">
	<x-block v-for="child in page.content" :value="child" @input="v => updateBlock(v)" :page="page" :hpml="hpml" :key="child.id" :h="2"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { parse } from '@syuilo/aiscript';
import { faHeart as faHeartS } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import XBlock from './page.block.vue';
import { Hpml } from '../../scripts/hpml/evaluator';
import { url } from '../../config';

export default defineComponent({
	components: {
		XBlock
	},

	props: {
		page: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
			hpml: null,
			faHeartS, faHeart
		};
	},

	created() {
		this.hpml = new Hpml(this, this.page, {
			randomSeed: Math.random(),
			visitor: this.$store.state.i,
			url: url,
			enableAiScript: !this.$store.state.device.disablePagesScript
		});
	},

	mounted() {
		this.$nextTick(() => {
			if (this.page.script && this.hpml.aiscript) {
				let ast;
				try {
					ast = parse(this.page.script);
				} catch (e) {
					console.error(e);
					/*this.$root.dialog({
						type: 'error',
						text: 'Syntax error :('
					});*/
					return;
				}
				this.hpml.aiscript.exec(ast).then(() => {
					this.hpml.eval();
				}).catch(e => {
					console.error(e);
					/*this.$root.dialog({
						type: 'error',
						text: e
					});*/
				});
			} else {
				this.hpml.eval();
			}
		});
	},

	beforeDestroy() {
		if (this.hpml.aiscript) this.hpml.aiscript.abort();
	},
});
</script>

<style lang="scss" scoped>
.iroscrza {
	&.serif {
		> div {
			font-family: serif;
		}
	}

	&.center {
		text-align: center;
	}
}
</style>
