export type Route =
  | { page: 'home' }
  | { page: 'login' }
  | { page: 'events' }
  | { page: 'moderation'; eventId: string }
  | { page: 'public'; publicCode: string }
  | { page: 'not-found' };

export function getRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  const publicMatch = /^\/public\/([a-f0-9]{32})$/.exec(path);
  if (publicMatch) {
    return { page: 'public', publicCode: publicMatch[1] };
  }

  const moderationMatch = /^\/creator\/events\/([^/]+)$/.exec(path);
  if (moderationMatch) {
    return { page: 'moderation', eventId: moderationMatch[1] };
  }

  if (path === '/') return { page: 'home' };
  if (path === '/login') return { page: 'login' };
  if (path === '/creator') return { page: 'events' };
  return { page: 'not-found' };
}

export function navigate(path: string): void {
  window.location.hash = path;
}
