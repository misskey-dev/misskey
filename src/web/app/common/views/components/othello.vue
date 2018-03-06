<template>
<div>
	<div v-if="session">
		<h1>相手を待っています<mk-ellipsis/></h1>
		<p>セッションID:<code>{{ session.code }}</code></p>
		<p>対戦したい相手に上記のセッションIDを伝えてください。相手が「セッションイン」でセッションIDを入力すると、対局が開始されます。</p>
	</div>
	<div v-else>
		<h1>Misskey Othello</h1>
		<p>他のMisskeyユーザーとオセロで対戦しよう。</p>
		<button>フリーマッチ(準備中)</button>
		<button @click="inSession">セッションイン</button>
		<button @click="createSession">セッションを作成する</button>
		<section>
			<h2>過去の対局</h2>
		</section>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	methods: {
		createSession() {
			(this as any).api('othello/sessions/create');

		}
	}
});
</script>

