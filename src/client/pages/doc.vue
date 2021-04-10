<template>
<div class="qyqbqfal" v-size="{ max: [500] }">
	<div class="title">{{ title }}</div>
	<div class="body" v-html="body"></div>
	<div class="footer">
		<MkLink :url="`https://github.com/misskey-dev/misskey/blob/master/src/docs/${lang}/${doc}.md`" class="at">{{ $ts.docSource }}</MkLink>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import MarkdownIt from 'markdown-it';
import MarkdownItAnchor from 'markdown-it-anchor';
import { url, lang } from '@client/config';
import MkLink from '@client/components/link.vue';

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
			INFO: computed(() => this.title ? {
				title: this.title,
				icon: faQuestionCircle,
			} : null),
			title: null,
			body: null,
			markdown: null,
			lang,
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
			fetch(`${url}/doc-assets/${lang}/${this.doc}.md`).then(res => res.text()).then(md => {
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
	padding: 32px;
	max-width: 800px;
	margin: 0 auto;

	&.max-width_500px {
		padding: 16px;
	}

	> .title {
		font-size: 1.5em;
		font-weight: bold;
		padding: 0 0 0.75em 0;
		margin: 0 0 1em 0;
		border-bottom: solid 2px var(--divider);
	}

	> .body {
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
			margin: 1.5em 0 1em 0;
			border-bottom: solid 0.5px var(--divider);
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
			border: solid 0.5px var(--divider);
			border-radius: 4px;
			box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
		}

		::v-deep(code) {
			display: inline-block;
			font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
			tab-size: 2;
			background: #272822;
			color: #f8f8f2;
			border-radius: 6px;
			padding: 4px 6px;
		}

		::v-deep(pre) {
			background: #272822;
			color: #f8f8f2;
			border-radius: 6px;
			padding: 12px 16px;

			> code {
				padding: 0;
			}
		}
	}

	> .footer {
		padding: 1.5em 0 0 0;
		margin: 1.5em 0 0 0;
		border-top: solid 2px var(--divider);
	}
}
</style>
