import { useEffect, useState } from 'react';
import { getHealthStatus, type HealthStatus } from './services/api';

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    getHealthStatus()
      .then(setHealth)
      .catch(() => setHealthError('Backend is unavailable.'));
  }, []);

  return (
    <main className="page">
      <section className="welcome-card" aria-labelledby="page-title">
        <p className="eyebrow">Livestream audience Q&amp;A</p>
        <h1 id="page-title">Creator Interaction Hub</h1>
        <p className="description">
          A simple space for creators to organise audience questions alongside
          their livestreams.
        </p>
        <p className="placeholder">
          The project foundation is ready. Event and question workflows will be
          added in a later milestone.
        </p>
        <p className="health" role="status">
          {health
            ? 'Backend and database are connected.'
            : healthError ?? 'Checking backend connection…'}
        </p>
      </section>
    </main>
  );
}
