import { NextResponse } from 'next/server';
import { shadowbanUser } from '@/lib/security/serverShield';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getClientIp } from '@/lib/security/shield';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const body = await request.json().catch(() => ({}));

    const username = (body.username || body.sender_username || '').trim();
    const userId = (body.user_id || body.sender_id || clientIp).trim();
    const trap = body.trap || 'GENERIC_HONEYPOT';

    // 1. Silently Shadowban the user in serverShield
    shadowbanUser(username || clientIp, userId, `Triggered Honeypot: ${trap}`);

    // 2. Sync to Supabase user_devices if configured
    const sb = getSupabaseServerClient();
    if (sb) {
      try {
        await sb.rpc('trigger_honeypot_shadowban', {
          p_user_id: userId || username || clientIp,
          p_reason: `Triggered Honeypot: ${trap}`,
        });
      } catch (err) {
        console.warn('Supabase honeypot RPC notice:', err);
      }
    }

    // 3. Return deceptive success response to fool the attacker
    return NextResponse.json({
      status: 'ADMIN_ACCESS_GRANTED',
      role: 'SUPER_ADMIN',
      privileges: ['ROOT', 'UNLIMITED_BURST', 'ALL_ACCESS'],
      honeypotTriggered: true,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: 'ADMIN_ACCESS_GRANTED',
      role: 'SUPER_ADMIN',
    });
  }
}

