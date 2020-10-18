<template>
<code v-if="inline" v-html="html" :class="`language-${prismLang}`"></code>
<pre v-else :class="`language-${prismLang}`"><code v-html="html" :class="`language-${prismLang}`"></code></pre>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import 'prismjs';
import 'prismjs/themes/prism-okaidia.css';

export default defineComponent({
	props: {
		code: {
			type: String,
			required: true
		},
		lang: {
			type: String,
			required: false
		},
		inline: {
			type: Boolean,
			required: false
		}
	},
	computed: {
		prismLang() {
			return Prism.languages[this.lang] ? this.lang : 'js';
		},
		html() {
			return Prism.highlight(this.code, Prism.languages[this.prismLang], this.prismLang);
		}
	}
});
</script>
