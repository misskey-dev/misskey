/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkLink from './MkLink.vue';
const meta = {
	title: 'components/MkLink',
	component: MkLink,
} satisfies Meta<typeof MkLink>;
export const Default = {
	render(args) {
		return {
			components: {
				MkLink,
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
			template: '<MkLink v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkLink>;
export default meta;
