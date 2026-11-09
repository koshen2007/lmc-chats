import fs from 'fs';
import path from 'path';

function getBannedStoragePath(): string {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isVercel) {
      return path.join('/tmp', 'lmc_banned_users.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'banned_users.json');
  } catch {
    return path.join(process.cwd(), 'banned_users.json');
  }
}

export function getBannedUsersList(): { username: string; user_id?: string; reason?: string }[] {
  try {
    const filePath = getBannedStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function isUserBanned(username?: string, userId?: string): boolean {
  if (!username && !userId) return false;
  const list = getBannedUsersList();
  const cleanUser = (username || '').trim().toLowerCase().replace(/^@/, '');
  const cleanId = (userId || '').trim().toLowerCase();

  return list.some((b) => {
    const bUser = (b.username || '').trim().toLowerCase().replace(/^@/, '');
    const bId = (b.user_id || '').trim().toLowerCase();
    return (cleanUser && bUser === cleanUser) || (cleanId && bId && bId === cleanId);
  });
}

export function addBannedUser(username: string, userId?: string, reason?: string): void {
  const list = getBannedUsersList();
  const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
  if (!list.some((b) => b.username.toLowerCase() === cleanUser)) {
    list.push({
      username: cleanUser,
      user_id: userId,
      reason: reason || 'Banned by admin',
    });
    try {
      const filePath = getBannedStoragePath();
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch {}
  }
}
