import { hardcodedPasswordRule } from './hardcodedPasswordRule';
import { unsafeEvalRule } from './unsafeEvalRule';
import { sqlInjectionRule } from './sqlInjectionRule';
import { SecurityRule } from '../types';
import { xssRule } from './xssRule';

export const rules: SecurityRule[] = [
  hardcodedPasswordRule,
  unsafeEvalRule,
  sqlInjectionRule,
  xssRule
];
