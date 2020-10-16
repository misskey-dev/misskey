<template>
<div>
	<main class="_section">
		<div class="_content">
			<ul>
				<li v-for="doc in docs" :key="doc.path">
					<router-link :to="`/docs/${doc.path}`">{{ doc.title }}</router-link>
				</li>
			</ul>
		</div>
	</main>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { url, lang } from '@/config';

export default defineComponent({
	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('help'),
					icon: faQuestionCircle
				}],
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
