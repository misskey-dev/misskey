import { User } from '@/models/entities/user.js';
import { db } from '@/db/postgre.js';

export const UserRepository = db.getRepository(User);
