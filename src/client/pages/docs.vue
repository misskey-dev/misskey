<template>
<div class="vtaihdtm">
	<div class="search">
		<MkInput v-model="query" :debounce="true" type="search" class="_inputNoTopMargin _inputNoBottomMargin">
			<template #prefix><i class="fas fa-search"></i></template>
			<template #label>{{ $ts.search }}</template>
		</MkInput>
	</div>
	<MkFolder>
		<template #header>{{ $ts._docs.generalTopics }}</template>
		<div class="docs">
			<MkA v-for="doc in docs.filter(doc => doc.path.startsWith('general/'))" :key="doc.path" :to="`/docs/${doc.path}`" class="doc">
				<div class="title">{{ doc.title }}</div>
				<div class="summary">{{ doc.summary }}</div>
				<div class="read">{{ $ts._docs.continueReading }}</div>
			</MkA>
		</div>
	</MkFolder>
	<MkFolder>
		<template #header>{{ $ts._docs.features }}</template>
		<div class="docs">
			<MkA v-for="doc in docs.filter(doc => doc.path.startsWith('features/'))" :key="doc.path" :to="`/docs/${doc.path}`" class="doc">
				<div class="title">{{ doc.title }}</div>
				<div class="summary">{{ doc.summary }}</div>
				<div class="read">{{ $ts._docs.continueReading }}</div>
			</MkA>
		</div>
	</MkFolder>
	<MkFolder>
		<template #header>{{ $ts._docs.advancedTopics }}</template>
		<div class="docs">
			<MkA v-for="doc in docs.filter(doc => doc.path.startsWith('advanced/'))" :key="doc.path" :to="`/docs/${doc.path}`" class="doc">
				<div class="title">{{ doc.title }}</div>
				<div class="summary">{{ doc.summary }}</div>
				<div class="read">{{ $ts._docs.continueReading }}</div>
			</MkA>
		</div>
	</MkFolder>
	<MkFolder>
		<template #header>{{ $ts._docs.admin }}</template>
		<div class="docs">
			<MkA v-for="doc in docs.filter(doc => doc.path.startsWith('admin/'))" :key="doc.path" :to="`/docs/${doc.path}`" class="doc">
				<div class="title">{{ doc.title }}</div>
				<div class="summary">{{ doc.summary }}</div>
				<div class="read">{{ $ts._docs.continueReading }}</div>
			</MkA>
		</div>
	</MkFolder>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { url, lang } from '@client/config';
import * as symbols from '@client/symbols';
import MkFolder from '@client/components/ui/folder.vue';
import MkInput from '@client/components/ui/input.vue';

export default defineComponent({
	components: {
		MkFolder,
		MkInput,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.help,
				icon: 'fas fa-question-circle'
			},
			docs: [],
			query: null,
		}
	},

	watch: {
		query() {
			fetch(`${url}/docs.json?lang=${lang}&q=${this.query}`).then(res => res.json()).then(docs => {
				this.docs = docs;
			});
		}
	},

	created() {
		fetch(`${url}/docs.json?lang=ja-JP`).then(res => res.json()).then(jaDocs => {
			fetch(`${url}/docs.json?lang=${lang}`).then(res => res.json()).then(docs => {
				this.docs = jaDocs.map(doc => {
					const exist = docs.find(d => d.path === doc.path);
					return exist || doc;
				});
			});
		});
	},
});
</script>

<style lang="scss" scoped>
.vtaihdtm {
	background: var(--panel);

	> .search {
		padding: 12px;
	}

	.docs {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
		grid-gap: 12px;
		margin: var(--margin);

		> .doc {
			display: inline-block;
			padding: 16px;
			border: solid 1px var(--divider);
			border-radius: 6px;

			&:hover {
				border: solid 1px var(--accent);
				text-decoration: none;
			}

			> .title {
				font-weight: bold;
			}

			> .summary {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				font-size: 0.9em;
			}

			> .read {
				color: var(--link);
				font-size: 0.9em;
			}
		}
	}
}
</style>
