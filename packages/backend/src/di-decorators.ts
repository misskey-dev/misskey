import { Injectable as NestInjectable } from '@nestjs/common';
import { inject } from 'yohira';

export function Injectable(
	...params: Parameters<typeof NestInjectable>
): ReturnType<typeof NestInjectable> {
	return NestInjectable(...params);
}

export function Inject(
	...params: Parameters<typeof inject>
): ReturnType<typeof inject> {
	return inject(...params);
}
