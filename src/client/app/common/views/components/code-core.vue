<template>
<x-prism :inline="inline" :language="prismLang">{{ code }}</x-prism>
</template>

<script lang="ts">
import Vue from 'vue';
import 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import XPrism from 'vue-prism-component';

export default Vue.extend({
	components: {
		XPrism
	},
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
		}
	}
});
</script>
