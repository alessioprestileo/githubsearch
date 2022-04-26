import React, { useRef, useState } from 'react';
import Paper from '@mui/material/Paper';
import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

import './App.css';

function App() {
  const [query, setQuery] = useState<string>('');
  const queryRef = useRef(query);
  const [searchResult, setSearchResult] = useState<any>(undefined);
  const handleQueryChange: InputBaseProps['onChange'] = (e) => {
    const { value } = e.target;
    setQuery(value);
  };
  const handleNewSearch: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    queryRef.current = query;
    const locationSearch = `?q=${encodeURIComponent(query)}`;
    fetch(`/.netlify/functions/github-users-graphql${locationSearch}`)
      .then((res) => res.json())
      .then((result) => setSearchResult(result));
  };
  const queryHasChanged = query !== queryRef.current;

  return (
    <div className="app">
      <div className="search-view">
        <header><h1>Search github users</h1></header>
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: 400,
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search Github"
            inputProps={{ 'aria-label': 'search github' }}
            value={query}
            onChange={handleQueryChange}
          />
          <IconButton
            type="submit"
            sx={{ p: '10px' }}
            aria-label="search"
            onClick={handleNewSearch}
            disabled={!(query && queryHasChanged)}
          >
            <SearchIcon />
          </IconButton>
        </Paper>
        {searchResult && (
          <>
            <div className="search-total">
              Found {searchResult.data.userCount} users
            </div>
            <div className="search-items">
              <ul className="search-items-list">
                {searchResult.data.users.map((item: User) => (
                  <li key={item.id}><UserCard {...item} /></li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface User {
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

const UserCard = ({ avatarUrl, bioHTML, email, followers, following, login, name, starredRepositories, url }: User) => (
  <div className="user-card">
    <div className="user-card-minimal-info">
      <div className="user-card-avatar-container">
        <img className="user-card-avatar-img" src={avatarUrl} alt="avatar" />
      </div>
      <div className="user-card-login"><a href={url}>{login}</a></div>
    </div>
    <div className="user-card-main-info">
      <div className="user-card-name"><h4>{name}</h4></div>
      <div className="user-card-bio" dangerouslySetInnerHTML={{ __html: bioHTML }} />
      <div className="user-card-email"><a href={`mailto:${email}`}>{email}</a></div>
    </div>
    <div className="user-card-counts">
      <div className="user-card-followers-count">Followers: {followers}</div>
      <div className="user-card-following-count">Following: {following}</div>
      <div className="user-card-starredRepositories-count">Starred: {starredRepositories}</div>
    </div>
  </div>
)

export default App;
