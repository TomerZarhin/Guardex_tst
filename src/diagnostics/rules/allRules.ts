import { hardcodedPasswordRule } from './hardcodedPasswordRule';
import { unsafeEvalRule } from './unsafeEvalRule';
import { sqlInjectionRule } from './sqlInjectionRule';
import { SecurityRule } from '../types';

export const rules: SecurityRule[] = [
  hardcodedPasswordRule,
  unsafeEvalRule,
  sqlInjectionRule
];
