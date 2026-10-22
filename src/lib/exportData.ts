import { backupFileName, makeBackup } from './storage';
import { shareFile } from './share';
import { showToast, snapshot } from '../state';

/** Exports a full backup: share sheet on phones, a download elsewhere. */
export async function exportBackup() {
  const res = await shareFile(backupFileName(), makeBackup(snapshot()), 'application/json');
  if (res === 'downloaded') showToast('Backup saved');
}
