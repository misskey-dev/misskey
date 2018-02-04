<template>
	<a :href="url" :target="target">
		<span class="schema">{{ schema }}//</span>
		<span class="hostname">{{ hostname }}</span>
		<span class="port" v-if="port != ''">:{{ port }}</span>
		<span class="pathname" v-if="pathname != ''">{{ pathname }}</span>
		<span class="query">{{ query }}</span>
		<span class="hash">{{ hash }}</span>
		%fa:external-link-square-alt%
	</a>
</template>

<script lang="typescript">
	export default {
		props: ['url', 'target'],
		created: function() {
			const url = new URL(this.url);

			this.schema = url.protocol;
			this.hostname = url.hostname;
			this.port = url.port;
			this.pathname = url.pathname;
			this.query = url.search;
			this.hash = url.hash;
		},
		data: {
			schema: null,
			hostname: null,
			port: null,
			pathname: null,
			query: null,
			hash: null
		}
	};
</script>

<style lang="stylus" scoped>
	:scope
		word-break break-all

	> a
		> [data-fa]
			padding-left 2px
			font-size .9em
			font-weight 400
			font-style normal

		> .schema
			opacity 0.5

		> .hostname
			font-weight bold

		> .pathname
			opacity 0.8

		> .query
			opacity 0.5

		> .hash
			font-style italic

</style>
