<template>
<div>
	<main class="_section">
		<div class="_content">
			<ul>
				<li v-for="doc in docs" :key="doc.path">
					<MkA :to="`/docs/${doc.path}`">{{ doc.title }}</MkA>
				</li>
			</ul>
		</div>
	</main>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { url, lang } from '@client/config';
import * as symbols from '@client/symbols';

export default defineComponent({
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.help,
				icon: 'fas fa-question-circle'
			},
			docs: [],
			faQuestionCircle
		}
	},

	created() {
		fetch(`${url}/docs.json?lang=${lang}`).then(res => res.json()).then(docs => {
			this.docs = docs;
		});
	},
});
</script>
