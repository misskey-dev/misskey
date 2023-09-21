<template>
<div class="geegznzt">
	<XAntenna :antenna="draft" @created="onAntennaCreated"/>
</div>
</template>

<script lang="ts" setup>
import XAntenna from './editor.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { useRouter } from '@/router';

const router = useRouter();

let draft = $ref({
	name: '',
	src: 'all',
	userListId: null,
	users: [],
	keywords: [],
	excludeKeywords: [],
	withReplies: false,
	caseSensitive: false,
	withFile: false,
	notify: false,
});

function onAntennaCreated() {
	router.push('/my/antennas');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.manageAntennas,
	icon: 'ti ti-antenna',
});
</script>

<style lang="scss" scoped>

</style>
