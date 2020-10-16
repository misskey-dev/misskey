<template>
<div>
	<main class="_section">
		<div class="_title"><Fa :icon="faFileAlt"/> {{ title }}</div>
		<div class="_content">
			<div v-html="body" class="qyqbqfal"></div>
		</div>
		<div class="_footer">
			<MkLink :url="`https://github.com/syuilo/misskey/blob/master/src/docs/${doc}.ja-JP.md`" class="at">{{ $t('docSource') }}</MkLink>
		</div>
	</main>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons'
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import { url, lang } from '@/config';
import MkLink from '@/components/link.vue';

const markdown = MarkdownIt({
	html: true
});

markdown.use(MarkdownItAnchor, {
	slugify: (s) => encodeURIComponent(String(s).trim().replace(/\s+/g, '-'))
});

export default defineComponent({
	components: {
		MkLink
	},

	props: {
		doc: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			INFO: {
				header: [{
					title: this.title,
					icon: faFileAlt
				}],
			},
			faFileAlt,
			title: '',
			body: '',
			markdown: '',
		}
	},

	watch: {
		doc: {
			handler() {
				this.fetchDoc();
			},
			immediate: true,
		}
	},

	methods: {
		fetchDoc() {
			fetch(`${url}/assets/docs/${this.doc}.${lang}.md`).then(res => res.text()).then(md => {
				this.parse(md);
			});
		},

		parse(md: string) {
			// 変数置換
			md = md.replace(/\{_URL_\}/g, url);

			// markdown の全容をパースする
			const parsed = markdown.parse(md, {});
			if (parsed.length === 0) return;

			const buf = [...parsed];
			const headingTokens = [];
			let headingStart = 0;

			// もっとも上にある見出しを抽出する
			while (buf[0].type !== 'heading_open') {
				buf.shift();
				headingStart++;
			}
			buf.shift();
			while (buf[0].type as string !== 'heading_close') {
				const token = buf.shift();
				if (token) {
					headingTokens.push(token);
				}
			}

			// 抽出した見出しを除く部分をbodyとして抽出する
			const bodyTokens = [...parsed];
			bodyTokens.splice(headingStart, headingTokens.length + 2);

			// 各々レンダーする
			this.title = markdown.renderer.render(headingTokens, {}, {});
			this.body = markdown.renderer.render(bodyTokens, {}, {});
		}
	}
});
</script>

<style lang="scss" scoped>
.qyqbqfal {
	> *:first-child {
		margin-top: 0;
	}

	> *:last-child {
		margin-bottom: 0;
	}

	::v-deep(a) {
		color: var(--link);
	}

	::v-deep(blockquote) {
		display: block;
		margin: 8px;
		padding: 6px 0 6px 12px;
		color: var(--fg);
		border-left: solid 3px var(--fg);
		opacity: 0.7;

		p {
			margin: 0;
		}
	}

	::v-deep(h2) {
		font-size: 1.25em;
		padding: 0 0 0.5em 0;
		border-bottom: solid 1px var(--divider);
	}

	::v-deep(table) {
		width: 100%;
		max-width: 100%;
		overflow: auto;
	}

	::v-deep(kbd.group) {
		display: inline-block;
		padding: 2px;
		border: 1px solid var(--divider);
		border-radius: 4px;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
	}

	::v-deep(kbd.key) {
		display: inline-block;
		padding: 6px 8px;
		border: solid 1px var(--divider);
		border-radius: 4px;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
	}
}
</style>
