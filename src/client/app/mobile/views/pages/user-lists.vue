<template>
<mk-ui>
	<span slot="header">%fa:list%%i18n:@title%</span>
	<template slot="func"><button @click="fn">%fa:plus%</button></template>
	<mk-user-lists @navigate="navigate"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	mounted() {
		document.title = 'Misskey %i18n:@title%';
	},
	methods: {
		fn() {
			(this as any).apis.input({
				title: '%i18n:@enter-list-name%',
			}).then(async title => {
				const list = await (this as any).api('users/lists/create', {
					title
				});

				this.$router.push(`/i/lists/${list.id}`);
			});
		},
		navigate(list) {
			this.$router.push(`/i/lists/${list.id}`);
		}
	}
});
</script>
