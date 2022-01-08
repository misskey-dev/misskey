<template>
<code v-if="inline" :class="`language-${prismLang}`" v-html="html"></code>
<pre v-else :class="`language-${prismLang}`"><code :class="`language-${prismLang}`" v-html="html"></code></pre>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import 'prismjs';
import 'prismjs/themes/prism-okaidia.css';

const props = defineProps<{
	code: string;
	lang?: string;
	inline?: boolean;
}>();

const prismLang = computed(() => Prism.languages[props.lang] ? props.lang : 'js');
const html = computed(() => Prism.highlight(props.code, Prism.languages[prismLang.value], prismLang.value));
</script>
