import type { DbGroup } from '../../types';
export declare function SelectGroups(): Promise<DbGroup[]>;
export declare function InsertGroup({ name, label, type, colour, hasAccount, grades, accountRoles }: DbGroup): Promise<boolean>;
export declare function RemoveGroup(groupName: string): Promise<number>;
export declare function AddCharacterGroup(charId: number, name: string, grade: number): Promise<boolean>;
export declare function UpdateCharacterGroup(charId: number, name: string, grade: number): Promise<boolean>;
export declare function RemoveCharacterGroup(charId: number, name: string): Promise<boolean>;
export declare function GetCharacterGroups(charId: number): Promise<{
    name: string;
    grade: number;
    isActive: boolean;
}[]>;
export declare function SetActiveGroup(charId: number, groupName?: string): Promise<void>;
