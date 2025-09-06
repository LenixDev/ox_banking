import type { OxAccountPermissions, OxAccountRole } from '../../types';
import type { OxPlayer } from 'player/class';
export declare function CheckRolePermission(roleName: OxAccountRole | null, permission: keyof OxAccountPermissions): boolean | undefined;
export declare function CanPerformAction(player: OxPlayer, accountId: number, role: OxAccountRole | null, action: keyof OxAccountPermissions): Promise<boolean>;
