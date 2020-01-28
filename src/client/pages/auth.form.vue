<template>
<div>
	<header>
		<h1 v-html="$t('share-access', { name })"></h1>
		<img :src="app.iconUrl"/>
	</header>
	<div class="app">
		<section>
			<h2>{{ app.name }}</h2>
			<p class="id">{{ app.id }}</p>
			<p class="description">{{ app.description }}</p>
		</section>
		<section>
			<h2>{{ $t('permission-ask') }}</h2>
			<ul>
				<template v-for="p in app.permission">
					<li :key="p">{{ $t(`@.permissions.${p}`) }}</li>
				</template>
			</ul>
		</section>
	</div>
	<div class="action">
		<button @click="cancel">{{ $t('cancel') }}</button>
		<button @click="accept">{{ $t('accept') }}</button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';

export default Vue.extend({
	i18n,
	props: ['session'],
	computed: {
		name(): string {
			const el = document.createElement('div');
			el.textContent = this.app.name
			return el.innerHTML;
		},
		app(): any {
			return this.session.app;
		}
	},
	methods: {
		cancel() {
			this.$root.api('auth/deny', {
				token: this.session.token
			}).then(() => {
				this.$emit('denied');
			});
		},

		accept() {
			this.$root.api('auth/accept', {
				token: this.session.token
			}).then(() => {
				this.$emit('accepted');
			});
		}
	}
});
</script>
