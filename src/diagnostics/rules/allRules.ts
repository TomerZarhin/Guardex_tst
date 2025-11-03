import { hardcodedPasswordRule } from './hardcodedPasswordRule';
import { unsafeEvalRule } from './unsafeEvalRule';
import { SecurityRule } from '../types';

export const rules: SecurityRule[] = [
  hardcodedPasswordRule,
  unsafeEvalRule
];
