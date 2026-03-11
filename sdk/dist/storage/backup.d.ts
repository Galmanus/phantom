/**
 * Backup utilities for PHANTOM notes
 */
import type { ShieldedNote, YieldPosition } from '../types';
export interface BackupData {
    version: string;
    created_at: number;
    notes: string[];
    yield_positions: string[];
}
export interface EncryptedBackupFile {
    version: string;
    created_at: number;
    encrypted_data: string;
    iv: string;
}
/**
 * Create backup data from notes and positions
 */
export declare function createBackupData(notes: ShieldedNote[], positions: YieldPosition[]): BackupData;
/**
 * Serialize backup data to JSON
 */
export declare function serializeBackup(data: BackupData): string;
/**
 * Deserialize backup data from JSON
 */
export declare function deserializeBackup(json: string): BackupData;
/**
 * Create downloadable backup file
 */
export declare function createBackupBlob(encryptedData: EncryptedBackupFile): Blob;
/**
 * Download backup file to user's device
 */
export declare function downloadBackup(blob: Blob, filename?: string): void;
/**
 * Parse uploaded backup file
 */
export declare function parseBackupFile(file: File): Promise<string>;
/**
 * Validate backup file structure
 */
export declare function validateBackupFile(data: unknown): data is EncryptedBackupFile;
/**
 * Get backup file info
 */
export declare function getBackupInfo(data: BackupData): {
    noteCount: number;
    positionCount: number;
    createdAt: Date;
};
//# sourceMappingURL=backup.d.ts.map