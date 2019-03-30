<template>
<mk-ui>
	<template #header><fa icon="list"/>{{ $t('title') }}</template>
	<template #func><button @click="$refs.lists.add()"><fa icon="plus"/></button></template>

	<x-lists ref="lists" @choosen="choosen"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/user-lists.vue'),
	data() {
		return {
			fetching: true,
			lists: []
		};
	},
	components: {
		XLists: () => import('../../../common/views/components/user-lists.vue').then(m => m.default)
	},
	mounted() {
		document.title = this.$t('title');
	},
	methods: {
		choosen(list) {
			if (!list) return;
			this.$router.push(`/i/lists/${list.id}`);
		}
	}
});
</script>
