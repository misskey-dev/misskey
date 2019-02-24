<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa icon="hashtag"/></span>{{ $route.params.tag }}</template>

	<main>
		<mk-notes ref="timeline" :make-promise="makePromise" @inited="inited"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

const limit = 20;

export default Vue.extend({
	i18n: i18n('mobile/views/pages/tag.vue'),
	data() {
		return {
			makePromise: cursor => this.$root.api('notes/search_by_tag', {
				limit: limit + 1,
				offset: cursor ? cursor : undefined,
				tag: this.$route.params.tag
			}).then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
					return {
						notes: notes,
						cursor: cursor ? cursor + limit : limit
					};
				} else {
					return {
						notes: notes,
						cursor: null
					};
				}
			})
		};
	},
	watch: {
		$route() {
			this.$refs.timeline.reload();
		}
	},
	methods: {
		inited() {
			Progress.done();
		},
	}
});
</script>
