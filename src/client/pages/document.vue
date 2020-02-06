<template>
<div>
	<portal to="icon"><fa :icon="faFileAlt"/></portal>
	<portal to="title">{{ title }}</portal>
	<main class="_card">
		<div class="_content">
			<div v-html="body"/>
		</div>
	</main>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons'
import MarkdownIt from 'markdown-it';

const markdown = MarkdownIt();

export default Vue.extend({
	metaInfo() {
		return {
			title: this.title,
		};
	},

	components: {
	},

	watch: {
		markdown() {
			this.updateText();
		}
	},

	data() {
		return {
			faFileAlt,
			title: '',
			body: '',
			markdown: `# ぽぺ
ぽぺ **ぽぺ** _ぽぺーーーーーっ！_ \`ぽぺ\`

\`\`\`
export default class Pope extends PopeBase
{
	public Pope() {
		return 'ぽぺ';
	}
}
\`\`\``,
		}
	},

	created() {
		this.updateText()
	},

	methods: {
		updateText() {
			// markdown の全容をパースする
			const parsed = markdown.parse(this.markdown, {});
			if (parsed.length === 0)
				return;

			const buf = [ ...parsed ]
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
			const bodyTokens = [ ...parsed ]
			bodyTokens.splice(headingStart, headingTokens.length + 2);

			// 各々レンダーする
			this.title = markdown.renderer.render(headingTokens, {}, {});
			this.body = markdown.renderer.render(bodyTokens, {}, {});
		}
	}
});
</script>
