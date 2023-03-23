/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMisskeyFlavoredMarkdown from './MkMisskeyFlavoredMarkdown.vue';
const meta = {
	title: 'components/global/MkMisskeyFlavoredMarkdown',
	component: MkMisskeyFlavoredMarkdown,
} satisfies Meta<typeof MkMisskeyFlavoredMarkdown>;
export const Default = {
	render(args) {
		return {
			components: {
				MkMisskeyFlavoredMarkdown,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkMisskeyFlavoredMarkdown v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMisskeyFlavoredMarkdown>;
export default meta;
