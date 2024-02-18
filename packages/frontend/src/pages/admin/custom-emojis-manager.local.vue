<template>
<div class="_gaps" :class="$style.root">
	<MkTab v-model="modeTab" style="margin-bottom: var(--margin);">
		<option value="list">登録済み絵文字一覧</option>
		<option value="register">新規登録</option>
	</MkTab>

	<div>
		<XListComponent v-if="modeTab === 'list'"/>
		<XRegisterComponent v-else/>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MkTab from '@/components/MkTab.vue';
import XListComponent from '@/pages/admin/custom-emojis-manager.local.list.vue';
import XRegisterComponent from '@/pages/admin/custom-emojis-manager.local.register.vue';

type PageMode = 'list' | 'register';

const modeTab = ref<PageMode>('list');
</script>

<style module lang="scss">
.root {
	padding: 16px;
	overflow: scroll;
}
</style>
