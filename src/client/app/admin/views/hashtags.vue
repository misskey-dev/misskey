<template>
<div>
	<ui-card>
		<template #title>{{ $t('hided-tags') }}</template>
		<section>
			<textarea class="jdnqwkzlnxcfftthoybjxrebyolvoucw" v-model="hiddenTags"></textarea>
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
			hiddenTags: '',
		};
	},
	created() {
		this.$root.getMeta().then(meta => {
			this.hiddenTags = meta.hiddenTags.join('\n');
		});
	},
	methods: {
		save() {
			this.$root.api('admin/update-meta', {
				hiddenTags: this.hiddenTags.split('\n')
			}).then(() => {
				//this.$root.os.apis.dialog({ text: `Saved` });
			}).catch(e => {
				//this.$root.os.apis.dialog({ text: `Failed ${e}` });
			});
		}
	}
});
</script>
