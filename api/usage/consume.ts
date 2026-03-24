import { getDailyUsage, incrementDailyUsage } from '../_lib/repository.js';
import { getFreeDailyLimit, getTodayUsageKey, resolveUsageSubject } from '../_lib/session.js';

function sendJson(response: any, statusCode: number, payload: unknown) {
  response.status(statusCode).json(payload);
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  const count = Number(request.body?.count || 0);

  if (!Number.isInteger(count) || count <= 0) {
    sendJson(response, 400, { message: 'Count must be a positive integer.' });
    return;
  }

  const usageSubject = await resolveUsageSubject(request, response);
  const usageDate = getTodayUsageKey();

  if (usageSubject.premium.active) {
    sendJson(response, 200, {
      ok: true,
      premium: true,
      usage: {
        date: usageDate,
        limit: null,
        used: 0,
        remaining: null,
      },
    });
    return;
  }

  const currentUsed = await getDailyUsage(usageSubject.subjectKey, usageDate);
  const limit = getFreeDailyLimit();

  if (currentUsed + count > limit) {
    sendJson(response, 429, {
      message: 'Daily free limit reached.',
      usage: {
        date: usageDate,
        limit,
        used: currentUsed,
        remaining: Math.max(0, limit - currentUsed),
      },
    });
    return;
  }

  const nextUsed = await incrementDailyUsage(usageSubject.subjectKey, usageDate, count);

  sendJson(response, 200, {
    ok: true,
    premium: false,
    usage: {
      date: usageDate,
      limit,
      used: nextUsed,
      remaining: Math.max(0, limit - nextUsed),
    },
  });
}
