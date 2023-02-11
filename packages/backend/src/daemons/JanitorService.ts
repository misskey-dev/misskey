import { LessThan } from 'typeorm';
import { IDisposable } from 'yohira';
import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import type { AttestationChallengesRepository } from '@/models/index.js';
import { bindThis } from '@/decorators.js';

const interval = 30 * 60 * 1000;

@Injectable()
export class JanitorService implements IDisposable {
	private intervalId: NodeJS.Timer;

	constructor(
		@Inject(DI.attestationChallengesRepository)
		private attestationChallengesRepository: AttestationChallengesRepository,
	) {
	}

	/**
	 * Clean up database occasionally
	 */
	@bindThis
	public start(): void {
		const tick = async () => {
			await this.attestationChallengesRepository.delete({
				createdAt: LessThan(new Date(new Date().getTime() - 5 * 60 * 1000)),
			});
		};

		tick();

		this.intervalId = setInterval(tick, interval);
	}

	@bindThis
	public dispose(): void {
		clearInterval(this.intervalId);
	}
}
