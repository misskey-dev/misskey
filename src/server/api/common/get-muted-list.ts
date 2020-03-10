import { User } from '../../../models/entities/user';
import { MutedWords } from '../../../models/';

export const getMutedList = (user: User) => MutedWords.find({ where: { userId: user.id } });