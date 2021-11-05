<template>
<MkModal ref="modal" @click="$emit('click')" @closed="$emit('closed')">
	<div class="hrmcaedk _window _narrow_" :style="{ width: `${width}px`, height: (height ? `min(${height}px, 100%)` : '100%') }">
		<div class="header" @contextmenu="onContextmenu">
			<button v-if="history.length > 0" class="_button" @click="back()" v-tooltip="$ts.goBack"><i class="fas fa-arrow-left"></i></button>
			<span v-else style="display: inline-block; width: 20px"></span>
			<span v-if="pageInfo" class="title">
				<i v-if="pageInfo.icon" class="icon" :class="pageInfo.icon"></i>
				<span>{{ pageInfo.title }}</span>
			</span>
			<button class="_button" @click="$refs.modal.close()"><i class="fas fa-times"></i></button>
		</div>
		<div class="body">
			<MkStickyContainer>
				<template #header><MkHeader v-if="pageInfo && !pageInfo.hideHeader" :info="pageInfo"/></template>
				<keep-alive>
					<component :is="component" v-bind="props" :ref="changePage"/>
				</keep-alive>
			</MkStickyContainer>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@client/components/ui/modal.vue';
import { popout } from '@client/scripts/popout';
import copyToClipboard from '@client/scripts/copy-to-clipboard';
import { resolve } from '@client/router';
import { url } from '@client/config';
import * as symbols from '@client/symbols';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkModal,
	},

	inject: {
		sideViewHook: {
			default: null
		}
	},

	provide() {
		return {
			navHook: (path) => {
				this.navigate(path);
			},
			shouldHeaderThin: true,
		};
	},

	props: {
		initialPath: {
			type: String,
			required: true,
		},
		initialComponent: {
			type: Object,
			required: true,
		},
		initialProps: {
			type: Object,
			required: false,
			default: () => {},
		},
	},

	emits: ['closed'],

	data() {
		return {
			width: 860,
			height: 660,
			pageInfo: null,
			path: this.initialPath,
			component: this.initialComponent,
			props: this.initialProps,
			history: [],
		};
	},

	computed: {
		url(): string {
			return url + this.path;
		},

		contextmenu() {
			return [{
				type: 'label',
				text: this.path,
			}, {
				icon: 'fas fa-expand-alt',
				text: this.$ts.showInPage,
				action: this.expand
			}, this.sideViewHook ? {
				icon: 'fas fa-columns',
				text: this.$ts.openInSideView,
				action: () => {
					this.sideViewHook(this.path);
					this.$refs.window.close();
				}
			} : undefined, {
				icon: 'fas fa-external-link-alt',
				text: this.$ts.popout,
				action: this.popout
			}, null, {
				icon: 'fas fa-external-link-alt',
				text: this.$ts.openInNewTab,
				action: () => {
					window.open(this.url, '_blank');
					this.$refs.window.close();
				}
			}, {
				icon: 'fas fa-link',
				text: this.$ts.copyLink,
				action: () => {
					copyToClipboard(this.url);
				}
			}];
		},
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
			}
		},

		navigate(path, record = true) {
			if (record) this.history.push(this.path);
			this.path = path;
			const { component, props } = resolve(path);
			this.component = component;
			this.props = props;
		},

		back() {
			this.navigate(this.history.pop(), false);
		},

		expand() {
			this.$router.push(this.path);
			this.$refs.window.close();
		},

		popout() {
			popout(this.path, this.$el);
			this.$refs.window.close();
		},

		onContextmenu(e) {
			os.contextMenu(this.contextmenu, e);
		}
	},
});
</script>

<style lang="scss" scoped>
.hrmcaedk {
	overflow: hidden;
	display: flex;
	flex-direction: column;
	contain: content;

	--root-margin: 24px;

	@media (max-width: 500px) {
		--root-margin: 16px;
	}

	> .header {
		$height: 52px;
		$height-narrow: 42px;
		display: flex;
		flex-shrink: 0;
		height: $height;
		line-height: $height;
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		box-shadow: 0px 1px var(--divider);

		> button {
			height: $height;
			width: $height;

			&:hover {
				color: var(--fgHighlighted);
			}
		}

		@media (max-width: 500px) {
			height: $height-narrow;
			line-height: $height-narrow;
			padding-left: 16px;

			> button {
				height: $height-narrow;
				width: $height-narrow;
			}
		}

		> .title {
			flex: 1;

			> .icon {
				margin-right: 0.5em;
			}
		}
	}

	> .body {
		overflow: auto;
		background: var(--bg);
	}
}
</style>
