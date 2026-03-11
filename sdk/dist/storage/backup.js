/**
 * Backup utilities for PHANTOM notes
 */
/**
 * Create backup data from notes and positions
 */
export function createBackupData(notes, positions) {
    return {
        version: '1',
        created_at: Date.now(),
        notes: notes.map(n => JSON.stringify(n)),
        yield_positions: positions.map(p => JSON.stringify(p)),
    };
}
/**
 * Serialize backup data to JSON
 */
export function serializeBackup(data) {
    return JSON.stringify(data, null, 2);
}
/**
 * Deserialize backup data from JSON
 */
export function deserializeBackup(json) {
    return JSON.parse(json);
}
/**
 * Create downloadable backup file
 */
export function createBackupBlob(encryptedData) {
    return new Blob([JSON.stringify(encryptedData, null, 2)], {
        type: 'application/json',
    });
}
/**
 * Download backup file to user's device
 */
export function downloadBackup(blob, filename = 'phantom-backup.json') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
/**
 * Parse uploaded backup file
 */
export async function parseBackupFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            }
            else {
                reject(new Error('Failed to read backup file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read backup file'));
        reader.readAsText(file);
    });
}
/**
 * Validate backup file structure
 */
export function validateBackupFile(data) {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    const backup = data;
    return (typeof backup.version === 'string' &&
        typeof backup.created_at === 'number' &&
        typeof backup.encrypted_data === 'string' &&
        typeof backup.iv === 'string');
}
/**
 * Get backup file info
 */
export function getBackupInfo(data) {
    return {
        noteCount: data.notes.length,
        positionCount: data.yield_positions.length,
        createdAt: new Date(data.created_at),
    };
}
//# sourceMappingURL=backup.js.map