import { Inject as NestInject, Injectable as NestInjectable } from '@nestjs/common';

export function Injectable(...params: Parameters<typeof NestInjectable>): ReturnType<typeof NestInjectable> {
	return NestInjectable(...params);
}

export function Inject(...params: Parameters<typeof NestInject>): ReturnType<typeof NestInject> {
	return NestInject(...params);
}
