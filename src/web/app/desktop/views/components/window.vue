<template>
<div :data-flexible="isFlexible" @dragover="onDragover">
	<div class="bg" ref="bg" v-show="isModal" @click="onBgClick"></div>
	<div class="main" ref="main" tabindex="-1" :data-is-modal="isModal" @mousedown="onBodyMousedown" @keydown="onKeydown">
		<div class="body">
			<header ref="header" @mousedown="onHeaderMousedown">
				<h1 data-yield="header"><yield from="header"/></h1>
				<div>
					<button class="popout" v-if="popoutUrl" @mousedown="repelMove" @click="popout" title="ポップアウト">%fa:R window-restore%</button>
					<button class="close" v-if="canClose" @mousedown="repelMove" @click="close" title="閉じる">%fa:times%</button>
				</div>
			</header>
			<div class="content" data-yield="content"><yield from="content"/></div>
		</div>
		<div class="handle top" v-if="canResize" @mousedown="onTopHandleMousedown"></div>
		<div class="handle right" v-if="canResize" @mousedown="onRightHandleMousedown"></div>
		<div class="handle bottom" v-if="canResize" @mousedown="onBottomHandleMousedown"></div>
		<div class="handle left" v-if="canResize" @mousedown="onLeftHandleMousedown"></div>
		<div class="handle top-left" v-if="canResize" @mousedown="onTopLeftHandleMousedown"></div>
		<div class="handle top-right" v-if="canResize" @mousedown="onTopRightHandleMousedown"></div>
		<div class="handle bottom-right" v-if="canResize" @mousedown="onBottomRightHandleMousedown"></div>
		<div class="handle bottom-left" v-if="canResize" @mousedown="onBottomLeftHandleMousedown"></div>
	</div>
</div>
</template>
