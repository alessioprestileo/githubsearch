import './UserCard.css';

export interface User {
  avatarUrl: string;
  bioHTML: string;
  email: string;
  followers: number;
  following: number;
  id: string;
  login: string;
  name: string;
  starredRepositories: number;
  url: string;
}

export const UserCard = ({
  avatarUrl,
  bioHTML,
  email,
  followers,
  following,
  login,
  name,
  starredRepositories,
  url,
}: User) => (
  <div className="user-card">
    <div className="user-card-minimal-info">
      <div className="user-card-minimal-info-avatar-container">
        <img
          className="user-card-minimal-info-avatar-img"
          src={avatarUrl}
          alt="avatar"
        />
      </div>
      <div className="user-card-minimal-info-login">
        <a href={url}>{login}</a>
      </div>
    </div>
    <div className="user-card-main-info">
      <div className="user-card-main-info-name">
        <h4>{name}</h4>
      </div>
      <div
        className="user-card-main-info-bio"
        dangerouslySetInnerHTML={{ __html: bioHTML }}
      />
      <div className="user-card-main-info-email">
        <a href={`mailto:${email}`}>{email}</a>
      </div>
    </div>
    <div className="user-card-counts">
      <div className="user-card-counts-followers">Followers: {followers}</div>
      <div className="user-card-counts-following">Following: {following}</div>
      <div className="user-card-counts-starredRepositories">
        Starred: {starredRepositories}
      </div>
    </div>
  </div>
);
