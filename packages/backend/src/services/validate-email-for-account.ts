import validateEmail from 'deep-email-validator';
import { UserProfiles } from '@/models';

export async function validateEmailForAccount(emailAddress: string): Promise<{
	available: boolean;
	reason: null | 'used' | 'format' | 'disposable' | 'mx' | 'smtp';
}> {
	const exist = await UserProfiles.count({
		emailVerified: true,
		email: emailAddress,
	});

	const validated = await validateEmail({
		email: emailAddress,
		validateRegex: true,
		validateMx: true,
		validateTypo: false, // TLDを見ているみたいだけどclubとか弾かれるので
		validateDisposable: true, // 捨てアドかどうかチェック
		validateSMTP: false, // 日本だと25ポートが殆どのプロバイダーで塞がれていてタイムアウトになるので
	});

	const available = exist === 0 && validated.valid;

	return {
		available,
		reason: available ? null :
			exist !== 0 ? 'used' :
			validated.reason === 'regex' ? 'format' :
			validated.reason === 'disposable' ? 'disposable' :
			validated.reason === 'mx' ? 'mx' :
			validated.reason === 'smtp' ? 'smtp' :
			null,
	};
}
