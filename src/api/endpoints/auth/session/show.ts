/**
 * Module dependencies
 */
import it from 'cafy';
import AuthSess from '../../../models/auth-session';
import serialize from '../../../serializers/auth-session';

/**
 * @swagger
 * /auth/session/show:
 *   post:
 *     summary: Show a session information
 *     parameters:
 *       -
 *         name: token
 *         description: Session Token
 *         in: formData
 *         required: true
 *         type: string
 *
 *     responses:
 *       200:
 *         description: OK
 *         schema:
 *           type: object
 *           properties:
 *             created_at:
 *               type: string
 *               format: date-time
 *               description: Date and time of the session creation
 *             app_id:
 *               type: string
 *               description: Application ID
 *             token:
 *               type: string
 *               description: Session Token
 *             user_id:
 *               type: string
 *               description: ID of user who create the session
 *             app:
 *               $ref: "#/definitions/Application"
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

/**
 * Show a session
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'token' parameter
	const [token, tokenErr] = it(params.token).expect.string().required().get();
	if (tokenErr) return rej('invalid token param');

	// Lookup session
	const session = await AuthSess.findOne({
		token: token
	});

	if (session == null) {
		return rej('session not found');
	}

	// Response
	res(await serialize(session, user));
});
