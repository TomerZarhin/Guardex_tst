import { HardcodedPasswordRule } from './hardcodedPasswordRule';
import { UnsafeEvalRule } from './unsafeEvalRule';
import { SqlInjectionRule } from './sqlInjectionRule';
import { XssRule } from './xssRule';
import { DomXssRule } from './domXssRule';
import { CookieWithoutSecureRule } from './cookieWithoutSecureRule';

export const rules = [
  new HardcodedPasswordRule(),
  new UnsafeEvalRule(),
  new SqlInjectionRule(),
  new XssRule(),
  new DomXssRule(),
  new CookieWithoutSecureRule()
];