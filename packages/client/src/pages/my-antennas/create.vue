<template>
<div class="geegznzt">
	<XAntenna :antenna="draft" @created="onAntennaCreated"/>
</div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import XAntenna from './editor.vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { Router } from '@/nirax';
import { mainRouter } from '@/router';

const router: Router = inject('router') ?? mainRouter;

let draft = $ref({
	name: '',
	src: 'all',
	userListId: null,
	userGroupId: null,
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

definePageMetadata({
	title: i18n.ts.manageAntennas,
	icon: 'fas fa-satellite',
	bg: 'var(--bg)',
});
</script>

<style lang="scss" scoped>

</style>
