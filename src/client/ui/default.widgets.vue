<template>
<div class="efzpzdvf">
	<template v-if="editMode">
		<MkButton primary @click="addWidget" class="add"><Fa :icon="faPlus"/></MkButton>
		<XDraggable
			v-model="widgets"
			item-key="id"
			handle=".handle"
			animation="150"
			class="sortable"
		>
			<template #item="{element}">
				<div class="customize-container _panel">
					<header>
						<span class="handle"><Fa :icon="faBars"/></span>{{ $t('_widgets.' + element.name) }}<button class="remove _button" @click="removeWidget(element)"><Fa :icon="faTimes"/></button>
					</header>
					<div @click="widgetFunc(element.id)">
						<component class="_inContainer_ _forceContainerFull_" :is="`mkw-${element.name}`" :widget="element" :ref="element.id" :setting-callback="setting => settings[element.id] = setting" @updateProps="saveWidget(element.id, $event)"/>
					</div>
				</div>
			</template>
		</XDraggable>
		<button @click="editMode = false" class="_textButton" style="font-size: 0.9em;"><Fa :icon="faCheck"/> {{ $t('editWidgetsExit') }}</button>
	</template>
	<template v-else>
		<component v-for="widget in widgets" class="_inContainer_ _forceContainerFull_" :is="`mkw-${widget.name}`" :key="widget.id" :widget="widget" @updateProps="saveWidget(element.id, $event)"/>
		<button @click="editMode = true" class="_textButton" style="font-size: 0.9em;"><Fa :icon="faPencilAlt"/> {{ $t('editWidgets') }}</button>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import { faPencilAlt, faPlus, faBars, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { widgets } from '@/widgets';
import * as os from '@/os';
import MkButton from '@/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton,
		XDraggable: defineAsyncComponent(() => import('vuedraggable').then(x => x.default)),
	},

	emits: ['mounted'],

	data() {
		return {
			editMode: false,
			settings: {},
			faPencilAlt, faPlus, faBars, faTimes, faCheck,
		};
	},

	computed: {
		widgets: {
			get() {
				return this.$store.reactiveState.widgets.value;
			},
			set(value) {
				this.$store.set('widgets', value);
			}
		},
	},

	mounted() {
		this.$emit('mounted', this.$el);
	},

	methods: {
		widgetFunc(id) {
			this.settings[id]();
		},

		async addWidget() {
			const { canceled, result: widget } = await os.dialog({
				type: null,
				title: this.$t('chooseWidget'),
				select: {
					items: widgets.map(widget => ({
						value: widget,
						text: this.$t('_widgets.' + widget),
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;

			this.$store.set('widgets', [...this.$store.state.widgets, {
				name: widget,
				id: uuid(),
				place: null,
				data: {}
			}]);
		},

		removeWidget(widget) {
			this.$store.set('widgets', this.$store.state.widgets.filter(w => w.id != widget.id));
		},

		saveWidget(id, data) {
			this.$store.set('widgets', this.$store.state.widgets.map(w => w.id === id ? {
				...w,
				data: data
			} : w));
		}
	}
});
</script>

<style lang="scss" scoped>
.efzpzdvf {
	position: sticky;
	height: min-content;
	min-height: 100vh;
	padding: var(--margin) 0;
	box-sizing: border-box;

	> * {
		margin: var(--margin) 0;
		width: 300px;

		&:first-child {
			margin-top: 0;
		}
	}

	> .add {
		margin: 0 auto;
	}

	.customize-container {
		margin: 8px 0;

		> header {
			position: relative;
			line-height: 32px;

			> .handle {
				padding: 0 8px;
				cursor: move;
			}

			> .remove {
				position: absolute;
				top: 0;
				right: 0;
				padding: 0 8px;
				line-height: 32px;
			}
		}

		> div {
			padding: 8px;

			> * {
				pointer-events: none;
			}
		}
	}
}
</style>
