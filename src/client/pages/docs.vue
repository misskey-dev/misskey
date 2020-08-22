<template>
<div>
	<teleport to="#_teleport_header"><fa :icon="faQuestionCircle"/>{{ $t('help') }}</teleport>
	<main class="_card">
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
import { url, lang } from '../config';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('help') as string,
		};
	},

	data() {
		return {
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
