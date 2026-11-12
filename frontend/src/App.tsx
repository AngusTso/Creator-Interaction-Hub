import { useEffect, useState } from 'react';
import CreatorHeader from './components/CreatorHeader';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import ModerationPage from './pages/ModerationPage';
import PublicEventPage from './pages/PublicEventPage';
import type { Creator } from './types';

type Route =
  | { page: 'home' }
  | { page: 'login' }
  | { page: 'events' }
  | { page: 'moderation'; eventId: string }
  | { page: 'public'; publicCode: string }
  | { page: 'not-found' };

interface Session {
  creator: Creator;
  accessToken: string;
}

function getRoute(hash: string): Route {
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

function navigate(path: string) {
  window.location.hash = path;
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const route = getRoute(hash);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  function handleLogin(creator: Creator, accessToken: string) {
    setSession({ creator, accessToken });
    setSessionNotice(null);
    if (route.page === 'home' || route.page === 'login') {
      navigate('/creator');
    }
  }

  function handleLogout() {
    setSession(null);
    setSessionNotice(null);
    navigate('/login');
  }

  function handleSessionExpired() {
    setSession(null);
    setSessionNotice('Your session expired. Sign in again to continue.');
    navigate('/login');
  }

  if (route.page === 'public') {
    return <PublicEventPage publicCode={route.publicCode} />;
  }

  if (route.page === 'not-found') {
    return (
      <main className="standalone-page">
        <p className="eyebrow">404 / NOT FOUND</p>
        <h1>THIS PAGE DOESN&apos;T EXIST.</h1>
        <a className="button button--primary" href="#/">
          BACK TO START
        </a>
      </main>
    );
  }

  if (route.page === 'home' || route.page === 'login') {
    if (session) {
      return (
        <EventsPage
          accessToken={session.accessToken}
          creator={session.creator}
          onLogout={handleLogout}
          onSessionExpired={handleSessionExpired}
          onOpenEvent={(eventId) => navigate(`/creator/events/${eventId}`)}
        />
      );
    }

    return (
      <LoginPage
        notice={sessionNotice}
        onLogin={handleLogin}
      />
    );
  }

  if (!session) {
    return (
      <LoginPage
        notice="Sign in to manage your events."
        onLogin={handleLogin}
      />
    );
  }

  if (route.page === 'events') {
    return (
      <EventsPage
        accessToken={session.accessToken}
        creator={session.creator}
        onLogout={handleLogout}
        onSessionExpired={handleSessionExpired}
        onOpenEvent={(eventId) => navigate(`/creator/events/${eventId}`)}
      />
    );
  }

  return (
    <div className="app-shell">
      <CreatorHeader creator={session.creator} onLogout={handleLogout} />
      <ModerationPage
        accessToken={session.accessToken}
        eventId={route.eventId}
        onBack={() => navigate('/creator')}
        onSessionExpired={handleSessionExpired}
      />
    </div>
  );
}
