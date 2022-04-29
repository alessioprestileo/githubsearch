import React, { useEffect, useReducer, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

import './Home.css';
import { Pagination } from '@mui/material';
import { User, UserCard } from '../../components/user-card/UserCard';
import { USERS_PER_PAGE } from './constants';
import { PaginationState, SearchState, State } from './types';
import {
  fetchNewCursor,
  performBackwardsSearch,
  performForwardSearch,
} from './search-utils';
import { reducer } from './reducer';

const useUrlSearchParams = (): URLSearchParams => {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
};

const initialPagination: PaginationState = {
  currentPage: 0,
  shiftingStatus: 'IDLE',
  requestedPage: 0,
};

const initialSearch: SearchState = {
  fetchingStatus: 'IDLE',
  query: undefined,
  result: undefined,
};

const initialState: State = {
  search: initialSearch,
  pagination: initialPagination,
};

const getTotalPages = (userCount: number): number =>
  parseInt(String(userCount / USERS_PER_PAGE)) + 1;

export const Home = () => {
  const isFirstRender = useRef(true);
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  const urlSearchParams = useUrlSearchParams();
  const requestedPageFromUrlSearchParams = urlSearchParams.get('page');
  const initialRequestedPageFromUrlSearchParams = useRef(
    requestedPageFromUrlSearchParams &&
      !isNaN(parseInt(requestedPageFromUrlSearchParams))
      ? parseInt(requestedPageFromUrlSearchParams)
      : undefined
  );
  const initialQueryFromUrlParams = useRef(
    urlSearchParams.get('q') || undefined
  );
  const previousSubmittedQuery = useRef<string | undefined>(undefined);

  const handleQueryChange: InputBaseProps['onChange'] = (e) => {
    const { value: query } = e.target;
    dispatch({ type: 'QUERY_UPDATED', payload: { query } });
  };

  useEffect(() => {
    const {
      pagination: { shiftingStatus },
      search: { fetchingStatus, query },
    } = state;
    if (isFirstRender.current && !query && initialQueryFromUrlParams.current) {
      isFirstRender.current = false;
      if (fetchingStatus === 'IDLE' && shiftingStatus === 'IDLE') {
        dispatch({
          type: 'FETCH_NEW_QUERY__REQUESTED',
          payload: { query: initialQueryFromUrlParams.current },
        });
        dispatch({ type: 'FETCH_NEW_QUERY__STARTED' });
        performForwardSearch(initialQueryFromUrlParams.current).then(
          (result) => {
            if (
              !initialRequestedPageFromUrlSearchParams.current ||
              initialRequestedPageFromUrlSearchParams.current <= 1
            ) {
              dispatch({
                type: 'FETCH_NEW_QUERY__SUCCESS',
                payload: { result, setFirstPage: true },
              });
            } else {
              dispatch({
                type: 'FETCH_NEW_QUERY__SUCCESS',
                payload: { result, paginationNeeded: true },
              });
              dispatch({
                type: 'SHIFT_PAGE__REQUESTED',
                payload: {
                  shift: initialRequestedPageFromUrlSearchParams.current - 1,
                },
              });
              previousSubmittedQuery.current = query;
            }
          }
        );
      }
    }
  }, [state]);

  useEffect(() => {
    const {
      pagination: { currentPage, shiftingStatus, requestedPage },
      search: { fetchingStatus, query, result },
    } = state;

    if (query && fetchingStatus === 'REQUESTED' && shiftingStatus === 'IDLE') {
      dispatch({ type: 'FETCH_NEW_QUERY__STARTED' });
      performForwardSearch(query).then((result) => {
        dispatch({ type: 'FETCH_NEW_QUERY__SUCCESS', payload: { result } });
        dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
      });

      return;
    }

    if (
      query &&
      result &&
      shiftingStatus === 'REQUESTED' &&
      (fetchingStatus === 'IDLE' || fetchingStatus === 'IDLE_PAGINATION_NEEDED')
    ) {
      dispatch({ type: 'SHIFT_PAGE__STARTED' });
      const shift = requestedPage - currentPage;
      const {
        pageInfo: { endCursor, startCursor },
        userCount,
      } = result.data;
      if (shift === 1) {
        performForwardSearch(query, endCursor).then((result) => {
          dispatch({ type: 'FETCH_NEW_QUERY__SUCCESS', payload: { result } });
          dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
        });
      } else if (shift === -1) {
        performBackwardsSearch(query, startCursor).then((result) => {
          dispatch({ type: 'FETCH_NEW_QUERY__SUCCESS', payload: { result } });
          dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
        });
      } else if (shift > 1 && currentPage + shift <= getTotalPages(userCount)) {
        fetchNewCursor(query, USERS_PER_PAGE * (shift - 1), endCursor).then(
          async (cursor) => {
            const result = await performForwardSearch(query, cursor);
            dispatch({ type: 'FETCH_NEW_QUERY__SUCCESS', payload: { result } });
            dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
          }
        );
      } else if (shift < -1 && currentPage + shift >= 1) {
        fetchNewCursor(query, USERS_PER_PAGE * (shift + 1), startCursor).then(
          async (cursor) => {
            performBackwardsSearch(query, cursor).then((result) => {
              dispatch({
                type: 'FETCH_NEW_QUERY__SUCCESS',
                payload: { result },
              });
              dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
            });
          }
        );
      }
    }
  }, [state]);

  const {
    pagination: { currentPage, shiftingStatus, requestedPage },
    search: { fetchingStatus, query, result },
  } = state;
  const queryHasChanged = query !== previousSubmittedQuery.current;
  const showResultItemsList =
    shiftingStatus === 'IDLE' && fetchingStatus !== 'IDLE_PAGINATION_NEEDED';

  return (
    <div className="home">
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
          navigate(`/?q=${encodeURIComponent(query!)}`);
          previousSubmittedQuery.current = query;
          dispatch({
            type: 'FETCH_NEW_QUERY__REQUESTED',
            payload: { query: query! },
          });
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search GitHub"
          inputProps={{ 'aria-label': 'search github' }}
          value={query || ''}
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
      {fetchingStatus === 'IN_PROGRESS' && shiftingStatus === 'IDLE' ? (
        <h3
          className="search-result-fetching"
          data-test-id="search-result-fetching"
        >
          FETCHING...
        </h3>
      ) : (
        result && (
          <>
            <div
              className="search-result-total"
              data-test-id="search-result-total"
            >
              Found {result.data.userCount}{' '}
              {result.data.userCount === 1 ? 'user' : 'users'}
            </div>
            <div
              className="search-result-items"
              data-test-id="search-result-items"
            >
              {showResultItemsList ? (
                <ul
                  className="search-result-items-list"
                  data-test-id="search-result-items-list"
                >
                  {result.data.users.map((item: User) => (
                    <li key={item.id}>
                      <UserCard {...item} />
                    </li>
                  ))}
                </ul>
              ) : (
                <h3
                  className="search-result-items-fetching"
                  data-test-id="search-result-items-fetching"
                >
                  FETCHING...
                </h3>
              )}
            </div>
            {requestedPage > 0 && (
              <Pagination
                className="search-result-pagination"
                data-test-id="search-result-pagination"
                count={getTotalPages(result.data.userCount)}
                page={requestedPage}
                onChange={(event, page) => {
                  navigate(
                    `/?q=${encodeURIComponent(
                      previousSubmittedQuery.current!
                    )}&page=${page}`
                  );
                  dispatch({
                    type: 'SHIFT_PAGE__REQUESTED',
                    payload: { shift: page - currentPage },
                  });
                }}
              />
            )}
          </>
        )
      )}
    </div>
  );
};
