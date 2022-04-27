import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Pagination } from '@mui/material';

export const App = () => (<Router><Home /></Router>);

const useUrlSearchParams = (): URLSearchParams => {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const USERS_PER_PAGE = 20;

interface SearchResult {
  data: {
    users: User[];
    userCount: number;
    pageInfo: {
      startCursor: string;
      endCursor: string;
    }
  }
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
}

const Home = () => {
  const isFirstRender = useRef(true);
  const urlSearchParams = useUrlSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>(urlSearchParams.get('q') || '');
  const queryRef = useRef(query);
  const [searchResult, setSearchResult] = useState<SearchResult | undefined>(undefined);
  const requestedPageFromUrlSearchParams = urlSearchParams.get('page');
  const [requestedPage, setRequestedPage] = useState<number | undefined>(requestedPageFromUrlSearchParams && !isNaN(parseInt(requestedPageFromUrlSearchParams)) ? parseInt(requestedPageFromUrlSearchParams) : undefined);
  const [paginationState, setPaginationState] = useState<PaginationState | undefined>(undefined);

  const handleQueryChange: InputBaseProps['onChange'] = (e) => {
    const { value } = e.target;
    setQuery(value);
  };
  const handleNewSearch = (): void => {
    queryRef.current = query;
    if (requestedPage === undefined || requestedPage === 1) {
      navigate(`/?q=${encodeURIComponent(query)}`);
      fetch(`/.netlify/functions/github-users-graphql?q=${encodeURIComponent(query)}&first=${USERS_PER_PAGE}`)
        .then((res) => res.json())
        .then((result: SearchResult) => {
          setSearchResult(result);
          setPaginationState({ currentPage: 1, totalPages: parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1 });
        });
    }
  };
  const memoizedHandleNewSearch = useCallback(() => handleNewSearch(), [handleNewSearch]);
  useEffect(() => {
    if (isFirstRender.current && query) {
      isFirstRender.current = false;
      memoizedHandleNewSearch();
    }
  }, [isFirstRender, memoizedHandleNewSearch, query]);
  useEffect(() => {
    if (!searchResult || !paginationState || !requestedPage) {
      return;
    }
    if (requestedPage === paginationState.currentPage + 1) {
      fetch(`/.netlify/functions/github-users-graphql?q=${encodeURIComponent(query)}&first=${USERS_PER_PAGE}&after=${searchResult.data.pageInfo.endCursor}`)
        .then((res) => res.json())
        .then((result: SearchResult) => {
          setSearchResult(result);
          setPaginationState({ currentPage: requestedPage, totalPages: parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1 });
          setRequestedPage(undefined);
        });
      return;
    }
    if (requestedPage === paginationState.currentPage - 1) {
      fetch(`/.netlify/functions/github-users-graphql?q=${encodeURIComponent(query)}&last=${USERS_PER_PAGE}&before=${searchResult.data.pageInfo.startCursor}`)
        .then((res) => res.json())
        .then((result: SearchResult) => {
          setSearchResult(result);
          setPaginationState({ currentPage: requestedPage, totalPages: parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1 });
          setRequestedPage(undefined);
        });
      return;
    }
  }, [requestedPage, searchResult, paginationState]);
  const queryHasChanged = query !== queryRef.current;

  return (
    <div className="app">
      <div className="search-view">
        <header><h1>Search GitHub users</h1></header>
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
            placeholder="Search GitHub"
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
            {
              paginationState &&
              <Pagination className="search-pagination" count={paginationState.totalPages} page={paginationState.currentPage} onChange={(event, page) => {
                setRequestedPage(page);
              }} />
            }
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
