import * as nodemailer from 'nodemailer';
import { fetchMeta } from '../misc/fetch-meta';
import Logger from './logger';
import config from '../config';

export const logger = new Logger('email');

export async function sendEmail(to: string, subject: string, text: string) {
	const meta = await fetchMeta(true);

	const enableAuth = meta.smtpUser != null && meta.smtpUser !== '';

	const transporter = nodemailer.createTransport({
		host: meta.smtpHost,
		port: meta.smtpPort,
		secure: meta.smtpSecure,
		ignoreTLS: !enableAuth,
		proxy: config.proxySmtp,
		auth: enableAuth ? {
			user: meta.smtpUser,
			pass: meta.smtpPass
		} : undefined
	} as any);

	try {
		const info = await transporter.sendMail({
			from: meta.email!,
			to: to,
			subject: subject || 'Misskey',
			text: text
		});

		logger.info('Message sent: %s', info.messageId);
	} catch (e) {
		logger.error(e);
		throw e;
	}
}
