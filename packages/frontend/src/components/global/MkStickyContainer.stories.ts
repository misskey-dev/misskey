/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkStickyContainer from './MkStickyContainer.vue';
const meta = {
	title: 'components/global/MkStickyContainer',
	component: MkStickyContainer,
} satisfies Meta<typeof MkStickyContainer>;
export const Default = {
	render(args) {
		return {
			components: {
				MkStickyContainer,
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
			template: '<MkStickyContainer v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkStickyContainer>;
export default meta;
