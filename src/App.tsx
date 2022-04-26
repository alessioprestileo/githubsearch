import React, { useEffect, useRef, useState } from 'react';
import {
  BrowserRouter as Router,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Paper from '@mui/material/Paper';
import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

import './App.css';

export const App = () => (<Router><Home /></Router>);

const useUrlSearchParams = (): URLSearchParams => {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const Home = () => {
  const urlSearchParams = useUrlSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>(urlSearchParams.get('q') || '');
  const queryRef = useRef(query);
  const [searchResult, setSearchResult] = useState<any>(undefined);
  const handleQueryChange: InputBaseProps['onChange'] = (e) => {
    const { value } = e.target;
    setQuery(value);
  };
  const handleNewSearch = (): void => {
    queryRef.current = query;
    const locationSearch = `?q=${encodeURIComponent(query)}`;
    navigate(`/${locationSearch}`);
    fetch(`/.netlify/functions/github-users-graphql${locationSearch}`)
      .then((res) => res.json())
      .then((result) => setSearchResult(result));
  };
  useEffect(() => {
    if (query) {
      handleNewSearch();
    }
  }, []);
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
            width: 600,
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
            onClick={e => { e.preventDefault(); handleNewSearch() }}
            disabled={!(query && queryHasChanged)}
          >
            <SearchIcon />
          </IconButton>
        </Paper>
        {searchResult && (
          <>
            <div className="search-total">
              Found {searchResult.data.userCount} {searchResult.data.userCount === 1 ? 'user' : 'users'}
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
      <div className="user-card-minimal-info-avatar-container">
        <img className="user-card-minimal-info-avatar-img" src={avatarUrl} alt="avatar" />
      </div>
      <div className="user-card-minimal-info-login"><a href={url}>{login}</a></div>
    </div>
    <div className="user-card-main-info">
      <div className="user-card-main-info-name"><h4>{name}</h4></div>
      <div className="user-card-main-info-bio" dangerouslySetInnerHTML={{ __html: bioHTML }} />
      <div className="user-card-main-info-email"><a href={`mailto:${email}`}>{email}</a></div>
    </div>
    <div className="user-card-counts">
      <div className="user-card-counts-followers">Followers: {followers}</div>
      <div className="user-card-counts-following">Following: {following}</div>
      <div className="user-card-counts-starredRepositories">Starred: {starredRepositories}</div>
    </div>
  </div>
)
