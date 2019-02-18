<template>
<div>
	<ui-card>
		<template #title>{{ $t('hided-tags') }}</template>
		<section>
			<textarea class="jdnqwkzlnxcfftthoybjxrebyolvoucw" v-model="hidedTags"></textarea>
			<ui-button @click="save">{{ $t('save') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';

export default Vue.extend({
	i18n: i18n('admin/views/hashtags.vue'),
	data() {
		return {
			hidedTags: '',
		};
	},
	created() {
		this.$root.getMeta().then(meta => {
			this.hidedTags = meta.hidedTags.join('\n');
		});
	},
	methods: {
		save() {
			this.$root.api('admin/update-meta', {
				hidedTags: this.hidedTags.split('\n')
			}).then(() => {
				//this.$root.os.apis.dialog({ text: `Saved` });
			}).catch(e => {
				//this.$root.os.apis.dialog({ text: `Failed ${e}` });
			});
		}
	}
});
</script>
