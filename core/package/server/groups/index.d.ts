import type { OxGroup, CreateGroupProperties } from '../../types';
export declare function GetGroup(name: string): OxGroup;
export declare function GetGroupsByType(type: string): string[];
export declare function GetGroupActivePlayers(groupName: string): number[];
export declare function GetGroupActivePlayersByType(type: string): number[];
export declare function SetGroupPermission(groupName: string, grade: number, permission: string, value: 'allow' | 'deny'): void;
export declare function RemoveGroupPermission(groupName: string, grade: number, permission: string): void;
export declare function CreateGroup(data: CreateGroupProperties): Promise<void>;
export declare function DeleteGroup(groupName: string): Promise<void>;
