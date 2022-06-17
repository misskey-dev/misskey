<template>
<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
	<FormLink to="/admin/tools/freeze" class="_formBlock">{{ i18n.ts._adminTools.freeze }}</FormLink>
</MkSpacer>
    
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

import FormLink from '@/components/form/link.vue';

defineExpose({
  [symbols.PAGE_INFO]: {
		title: i18n.ts.adminTools,
		icon: 'fas fa-tools',
		bg: 'var(--bg)',
	}
});
</script>
