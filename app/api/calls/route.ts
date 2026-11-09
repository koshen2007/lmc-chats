import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export interface CallSession {
  id: string;
  caller: string;
  caller_name: string;
  caller_avatar: string;
  receiver: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'ended';
  offer?: any;
  answer?: any;
  caller_ice: any[];
  receiver_ice: any[];
  created_at: number;
  accepted_at?: number;
  ended_at?: number;
  duration?: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __LMC_CALLS_STORE__: Map<string, CallSession> | undefined;
}

function getCallsStore(): Map<string, CallSession> {
  if (!globalThis.__LMC_CALLS_STORE__) {
    globalThis.__LMC_CALLS_STORE__ = new Map();
  }
  return globalThis.__LMC_CALLS_STORE__;
}

// Clean up stale calls older than 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const store = getCallsStore();
    const now = Date.now();
    store.forEach((call, id) => {
      if (now - call.created_at > 300_000) {
        store.delete(id);
      }
    });
  }, 60_000);
}

// GET /api/calls?user=<username>&call_id=<id>
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = (searchParams.get('user') || '').trim().toLowerCase().replace(/^@/, '');
    const callId = searchParams.get('call_id');

    const store = getCallsStore();

    // If specific call requested
    if (callId) {
      const call = store.get(callId);
      if (call) {
        return NextResponse.json({ success: true, call });
      }

      // Fallback check Supabase
      const sb = getSupabaseServerClient();
      if (sb) {
        const { data } = await sb.from('calls').select('*').eq('id', callId).single();
        if (data) {
          return NextResponse.json({ success: true, call: data });
        }
      }

      return NextResponse.json({ success: false, error: 'Call not found' }, { status: 404 });
    }

    // Check for active incoming calls for user
    if (user) {
      let incomingCall: CallSession | null = null;
      store.forEach((call) => {
        if (
          call.receiver.toLowerCase() === user &&
          call.status === 'ringing' &&
          Date.now() - call.created_at < 45_000
        ) {
          incomingCall = call;
        }
      });

      return NextResponse.json({
        success: true,
        incomingCall,
      });
    }

    return NextResponse.json({ success: false, error: 'user or call_id parameter required' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/calls
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;
    const store = getCallsStore();
    const sb = getSupabaseServerClient();

    // 1. INITIATE CALL (Caller starts ringing receiver)
    if (action === 'initiate') {
      const { caller, caller_name, caller_avatar, receiver, type, offer } = body;
      const cleanCaller = (caller || '').trim().toLowerCase().replace(/^@/, '');
      const cleanReceiver = (receiver || '').trim().toLowerCase().replace(/^@/, '');

      if (!cleanCaller || !cleanReceiver || !offer) {
        return NextResponse.json({ success: false, error: 'Missing call parameters' }, { status: 400 });
      }

      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const callSession: CallSession = {
        id: callId,
        caller: cleanCaller,
        caller_name: caller_name || cleanCaller,
        caller_avatar: caller_avatar || '',
        receiver: cleanReceiver,
        type: type === 'video' ? 'video' : 'audio',
        status: 'ringing',
        offer,
        caller_ice: [],
        receiver_ice: [],
        created_at: Date.now(),
      };

      store.set(callId, callSession);

      if (sb) {
        Promise.resolve(
          sb.from('calls').insert([
            {
              id: callId,
              caller_username: cleanCaller,
              receiver_username: cleanReceiver,
              call_type: callSession.type,
              status: 'ringing',
              offer,
            },
          ])
        ).catch(() => {});
      }

      return NextResponse.json({ success: true, callId, call: callSession });
    }

    // 2. ANSWER CALL (Receiver accepts call with answer SDP)
    if (action === 'answer' || action === 'accept') {
      const { call_id, answer } = body;
      const session = store.get(call_id);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Call session expired' }, { status: 404 });
      }

      session.answer = answer;
      session.status = 'accepted';
      session.accepted_at = Date.now();
      store.set(call_id, session);

      if (sb) {
        Promise.resolve(
          sb.from('calls').update({ answer, status: 'accepted' }).eq('id', call_id)
        ).catch(() => {});
      }

      return NextResponse.json({ success: true, call: session });
    }

    // 3. ICE CANDIDATE EXCHANGE
    if (action === 'ice_candidate') {
      const { call_id, candidate, is_caller } = body;
      const session = store.get(call_id);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Call session not found' }, { status: 404 });
      }

      if (is_caller) {
        session.caller_ice.push(candidate);
      } else {
        session.receiver_ice.push(candidate);
      }
      store.set(call_id, session);

      return NextResponse.json({ success: true });
    }

    // 4. REJECT CALL
    if (action === 'reject') {
      const { call_id } = body;
      const session = store.get(call_id);
      if (session) {
        session.status = 'rejected';
        session.ended_at = Date.now();
        store.set(call_id, session);

        if (sb) {
          Promise.resolve(
            sb.from('calls').update({ status: 'rejected', ended_at: new Date().toISOString() }).eq('id', call_id)
          ).catch(() => {});
        }
      }
      return NextResponse.json({ success: true });
    }

    // 5. END CALL (Hang up)
    if (action === 'end') {
      const { call_id } = body;
      const session = store.get(call_id);
      let duration = 0;
      if (session) {
        session.status = 'ended';
        session.ended_at = Date.now();
        if (session.accepted_at) {
          duration = Math.floor((session.ended_at - session.accepted_at) / 1000);
          session.duration = duration;
        }
        store.set(call_id, session);

        if (sb) {
          Promise.resolve(
            sb
              .from('calls')
              .update({
                status: 'ended',
                ended_at: new Date().toISOString(),
                duration,
              })
              .eq('id', call_id)
          ).catch(() => {});
        }
      }
      return NextResponse.json({ success: true, duration, call: session });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

