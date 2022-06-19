<template>
<div class="mk-app">
	<div class="contents">
		<header class="header">
			<MkPageHeader :info="pageMetadata"/>
		</header>
		<main ref="main">
			<div class="content">
				<RouterView/>
			</div>
		</main>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { provide, ComputedRef } from 'vue';
import XCommon from './_common_/common.vue';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});

document.documentElement.style.overflowY = 'scroll';
</script>

<style lang="scss" scoped>
.mk-app {
	$header-height: 52px;
	$ui-font-size: 1em; // TODO: どこかに集約したい

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;

	> .contents {
		padding-top: $header-height;

		> .header {
			position: fixed;
			z-index: 1000;
			top: 0;
			height: $header-height;
			width: 100%;
			line-height: $header-height;
			text-align: center;
			//background-color: var(--panel);
			-webkit-backdrop-filter: var(--blur, blur(32px));
			backdrop-filter: var(--blur, blur(32px));
			background-color: var(--header);
			border-bottom: solid 0.5px var(--divider);
		}

		> main {
			> .content {
				> * {
					// ほんとは単に calc(100vh - #{$header-height}) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
					min-height: calc((var(--vh, 1vh) * 100) - #{$header-height});
				}
			}
		}
	}
}
</style>
