import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BrowserRouter as Router,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import Paper from '@mui/material/Paper';
import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

import './App.css';
import { Pagination } from '@mui/material';
import { User, UserCard } from './UserCard';

export const App = () => (
  <Router>
    <Home />
  </Router>
);

const useUrlSearchParams = (): URLSearchParams => {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
};

const USERS_PER_PAGE = 20;
const MAX_CURSOR_SHIFT = 100;

const getNextCursorShift = (
  shift: number
): { nextShift: number; remainder: number } => {
  if (Math.abs(shift) >= MAX_CURSOR_SHIFT) {
    if (shift > 0) {
      return {
        nextShift: MAX_CURSOR_SHIFT,
        remainder: shift - MAX_CURSOR_SHIFT,
      };
    } else {
      return {
        nextShift: -MAX_CURSOR_SHIFT,
        remainder: shift + MAX_CURSOR_SHIFT,
      };
    }
  } else {
    return { nextShift: shift, remainder: 0 };
  }
};

const fetchNewCursor = async (
  query: string,
  shift: number,
  initialCursor?: string
): Promise<string> => {
  let { remainder, nextShift } = getNextCursorShift(shift);
  let cursor: string = initialCursor || '';
  let hasNextPage = true;
  let hasPreviousPage = true;

  while (Math.abs(nextShift) > 0) {
    const res: { data: { pageInfo: MoveCursorPageInfo } } = await fetch(
      `/.netlify/functions/github-users-move-cursor?q=${encodeURIComponent(
        query
      )}&shift=${nextShift}${cursor ? `&cursor=${cursor}` : ''}`
    ).then((res) => res.json());
    const { startCursor, endCursor } = res.data.pageInfo;
    hasNextPage = res.data.pageInfo.hasNextPage;
    hasPreviousPage = res.data.pageInfo.hasPreviousPage;
    if ((shift > 0 && !hasNextPage) || (shift < 0 && !hasPreviousPage)) break;

    if (shift > 0) {
      cursor = endCursor;
    } else {
      cursor = startCursor;
    }
    const next = getNextCursorShift(remainder);
    remainder = next.remainder;
    nextShift = next.nextShift;
  }

  return cursor;
};

interface PageInfo {
  startCursor: string;
  endCursor: string;
}

interface MoveCursorPageInfo extends PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchResult {
  data: {
    users: User[];
    userCount: number;
    pageInfo: PageInfo;
  };
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
  const [searchResult, setSearchResult] = useState<SearchResult | undefined>(
    undefined
  );
  const requestedPageFromUrlSearchParams = urlSearchParams.get('page');
  const parsedRequestedPageFromUrlSearchParams = useRef(
    requestedPageFromUrlSearchParams &&
      !isNaN(parseInt(requestedPageFromUrlSearchParams))
      ? parseInt(requestedPageFromUrlSearchParams)
      : undefined
  );
  const [requestedPage, setRequestedPage] = useState<number | undefined>(
    parsedRequestedPageFromUrlSearchParams.current
  );
  const [paginationState, setPaginationState] = useState<
    PaginationState | undefined
  >(undefined);
  const [isFetching, setIsFecthing] = useState(false);

  const handleQueryChange: InputBaseProps['onChange'] = (e) => {
    const { value } = e.target;
    setQuery(value);
  };
  const handleNewSearch = useCallback(() => {
    const fn = async () => {
      queryRef.current = query;

      const result: SearchResult = await fetch(
        `/.netlify/functions/github-users-search?q=${encodeURIComponent(
          query
        )}&first=${USERS_PER_PAGE}`
      ).then((res) => res.json());

      setSearchResult(result);
      setPaginationState({
        currentPage: 1,
        totalPages:
          parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1,
      });
    };
    fn();
  }, [query]);

  useEffect(() => {
    if (!searchResult || !paginationState) {
      if (!isFetching && query && query === urlSearchParams.get('q')) {
        setIsFecthing(true);
        handleNewSearch();
      }
      return;
    }

    if (!requestedPage) {
      setIsFecthing(false);
    }

    if (isFirstRender.current && requestedPage === 1) {
      isFirstRender.current = false;
      setIsFecthing(false);
    }

    if (!requestedPage || requestedPage === paginationState.currentPage) {
      return;
    }

    const { currentPage, totalPages } = paginationState;
    const pageShift = requestedPage - currentPage;
    if (pageShift > 1 && currentPage + pageShift <= totalPages) {
      fetchNewCursor(
        query,
        USERS_PER_PAGE * (pageShift - 1),
        searchResult.data.pageInfo.endCursor
      ).then((cursor) => {
        return fetch(
          `/.netlify/functions/github-users-search?q=${encodeURIComponent(
            query
          )}&first=${USERS_PER_PAGE}&after=${cursor}`
        )
          .then((res) => res.json())
          .then((result: SearchResult) => {
            setSearchResult(result);
            setPaginationState({
              currentPage: requestedPage,
              totalPages:
                parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1,
            });
            setIsFecthing(false);
          });
      });
    }
    if (pageShift < -1 && currentPage + pageShift > 0) {
      fetchNewCursor(
        query,
        USERS_PER_PAGE * (pageShift + 1),
        searchResult.data.pageInfo.startCursor
      ).then((cursor) => {
        return fetch(
          `/.netlify/functions/github-users-search?q=${encodeURIComponent(
            query
          )}&last=${USERS_PER_PAGE}&before=${cursor}`
        )
          .then((res) => res.json())
          .then((result: SearchResult) => {
            setSearchResult(result);
            setPaginationState({
              currentPage: requestedPage,
              totalPages:
                parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1,
            });
            setIsFecthing(false);
          });
      });
    }
    if (pageShift === 1) {
      fetch(
        `/.netlify/functions/github-users-search?q=${encodeURIComponent(
          query
        )}&first=${USERS_PER_PAGE}&after=${
          searchResult.data.pageInfo.endCursor
        }`
      )
        .then((res) => res.json())
        .then((result: SearchResult) => {
          setSearchResult(result);
          setPaginationState({
            currentPage: requestedPage,
            totalPages:
              parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1,
          });
          setIsFecthing(false);
        });
      return;
    }
    if (pageShift === -1) {
      fetch(
        `/.netlify/functions/github-users-search?q=${encodeURIComponent(
          query
        )}&last=${USERS_PER_PAGE}&before=${
          searchResult.data.pageInfo.startCursor
        }`
      )
        .then((res) => res.json())
        .then((result: SearchResult) => {
          setSearchResult(result);
          setPaginationState({
            currentPage: requestedPage,
            totalPages:
              parseInt(String(result.data.userCount / USERS_PER_PAGE)) + 1,
          });
          setIsFecthing(false);
        });
      return;
    }
  }, [
    query,
    requestedPage,
    searchResult,
    paginationState,
    handleNewSearch,
    isFetching,
    urlSearchParams,
  ]);
  const queryHasChanged = query !== queryRef.current;

  return (
    <div className="app">
      <div className="search-view">
        <header>
          <h1 data-test-id="header-title">Search GitHub Users</h1>
        </header>
        <Paper
          data-test-id="search-box"
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: 600,
          }}
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            navigate(`/?q=${encodeURIComponent(query)}`);
            setIsFecthing(true);
            setPaginationState(undefined);
            setSearchResult(undefined);
            handleNewSearch();
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
            disabled={!(query && queryHasChanged)}
          >
            <SearchIcon />
          </IconButton>
        </Paper>
        {!searchResult && isFetching && (
          <h3
            className="search-result-fetching"
            data-test-id="search-result-fetching"
          >
            FETCHING...
          </h3>
        )}
        {searchResult && (
          <>
            <div
              className="search-result-total"
              data-test-id="search-result-total"
            >
              Found {searchResult.data.userCount}{' '}
              {searchResult.data.userCount === 1 ? 'user' : 'users'}
            </div>
            <div
              className="search-result-items"
              data-test-id="search-result-items"
            >
              {isFetching && (
                <h3
                  className="search-result-items-fetching"
                  data-test-id="search-result-items-fetching"
                >
                  FETCHING...
                </h3>
              )}
              {!isFetching && (
                <ul
                  className="search-result-items-list"
                  data-test-id="search-result-items-list"
                >
                  {searchResult.data.users.map((item: User) => (
                    <li key={item.id}>
                      <UserCard {...item} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {paginationState && (
              <Pagination
                className="search-result-pagination"
                data-test-id="search-result-pagination"
                count={paginationState.totalPages}
                page={requestedPage}
                onChange={(event, page) => {
                  setIsFecthing(true);
                  navigate(`/?q=${encodeURIComponent(query)}&page=${page}`);
                  setRequestedPage(page);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
