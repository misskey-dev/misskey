<template>
<MkContainer :show-header="props.showHeader">
	<template #header><i class="fas fa-rss-square"></i>RSS</template>
	<template #func><button class="_button" @click="setting"><i class="fas fa-cog"></i></button></template>

	<div class="ekmkgxbj">
		<MkLoading v-if="fetching"/>
		<div class="feed" v-else>
			<a v-for="item in items" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkContainer from '@client/components/ui/container.vue';
import define from './define';
import * as os from '@client/os';

const widget = define({
	name: 'rss',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		url: {
			type: 'string',
			default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer
	},
	data() {
		return {
			items: [],
			fetching: true,
			clock: null,
		};
	},
	mounted() {
		this.fetch();
		this.clock = setInterval(this.fetch, 60000);
		this.$watch(() => this.props.url, this.fetch);
	},
	beforeUnmount() {
		clearInterval(this.clock);
	},
	methods: {
		fetch() {
			fetch(`https://api.rss2json.com/v1/api.json?rss_url=${this.props.url}`, {
			}).then(res => {
				res.json().then(feed => {
					this.items = feed.items;
					this.fetching = false;
				});
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.ekmkgxbj {
	> .feed {
		padding: 0;
		font-size: 0.9em;

		> a {
			display: block;
			padding: 8px 16px;
			color: var(--fg);
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;

			&:nth-child(even) {
				background: rgba(#000, 0.05);
			}
		}
	}
}
</style>
