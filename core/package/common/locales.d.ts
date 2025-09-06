import { type FlattenObjectKeys } from '@communityox/ox_lib';
type Locales = FlattenObjectKeys<typeof import('../locales/en.json')>;
declare const _default: <T extends Locales>(str: T, ...args: any[]) => string;
export default _default;
