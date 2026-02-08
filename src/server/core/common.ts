import { locale, type FlattenObjectKeys } from '@communityox/ox_lib'

type Locales = FlattenObjectKeys<typeof import('./locales.json')>

export const locales = <T extends Locales>(str: T, ...args: any[]) => locale(str, ...args) as string
export default locales