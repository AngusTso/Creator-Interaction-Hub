import type { Creator } from '../types';

interface Props {
  creator: Creator;
  onLogout: () => void;
}

export default function CreatorHeader({ creator, onLogout }: Props) {
  return (
    <header className="topbar">
      <a className="brand" href="#/creator" aria-label="Creator Interaction Hub home">
        <span className="brand-mark" aria-hidden="true">CH</span>
        <span className="brand-name">CREATOR / INTERACTION HUB</span>
      </a>
      <div className="topbar-actions">
        <span className="creator-name">{creator.username}</span>
        <button className="button button--secondary" onClick={onLogout} type="button">
          LOG OUT
        </button>
      </div>
    </header>
  );
}
