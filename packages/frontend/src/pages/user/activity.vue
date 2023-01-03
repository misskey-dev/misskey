<template>
<MkSpacer :content-max="700">
	<MkFolder class="item">
		<template #header>Heatmap</template>
		<XHeatmap :user="user" :src="'notes'"/>
	</MkFolder>
	<MkFolder class="item">
		<template #header>PV</template>
		<XPv :user="user"/>
	</MkFolder>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import XHeatmap from './activity.heatmap.vue';
import XPv from './activity.pv.vue';
import MkFolder from '@/components/MkFolder.vue';

const props = defineProps<{
	user: misskey.entities.User;
}>();

</script>

<style lang="scss" scoped>

</style>
