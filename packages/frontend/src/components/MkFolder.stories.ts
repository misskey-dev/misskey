/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFolder from './MkFolder.vue';
const meta = {
	title: 'components/MkFolder',
	component: MkFolder,
} satisfies Meta<typeof MkFolder>;
export const Default = {
	render(args) {
		return {
			components: {
				MkFolder,
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
			template: '<MkFolder v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFolder>;
export default meta;
