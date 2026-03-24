import { getDailyUsage } from '../_lib/repository.js';
import { getFreeDailyLimit, getTodayUsageKey, resolveUsageSubject } from '../_lib/session.js';

function sendJson(response: any, statusCode: number, payload: unknown) {
  response.status(statusCode).json(payload);
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  const usageSubject = await resolveUsageSubject(request, response);
  const usageDate = getTodayUsageKey();
  const used = usageSubject.premium.active ? 0 : await getDailyUsage(usageSubject.subjectKey, usageDate);
  const limit = usageSubject.premium.active ? null : getFreeDailyLimit();
  const remaining = usageSubject.premium.active ? null : Math.max(0, getFreeDailyLimit() - used);

  sendJson(response, 200, {
    authenticated: usageSubject.authenticated,
    email: usageSubject.email,
    premium: usageSubject.premium,
    usage: {
      date: usageDate,
      limit,
      used,
      remaining,
    },
  });
}
