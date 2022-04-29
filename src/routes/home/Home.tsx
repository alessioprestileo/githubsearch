import React, { useEffect, useReducer } from 'react';
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
  currentPage: 1,
  shiftingStatus: 'IDLE',
  requestedPage: 1,
};

const initialSearch: SearchState = {
  fetchingStatus: 'IDLE',
  query: undefined,
  previousRequestedQuery: undefined,
  result: undefined,
};

const initialState: State = {
  search: initialSearch,
  pagination: initialPagination,
};

const getTotalPages = (userCount: number): number =>
  parseInt(String(userCount / USERS_PER_PAGE)) + 1;

export const Home = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);

  const urlSearchParams = useUrlSearchParams();
  useEffect(() => {
    const {
      pagination: { currentPage, shiftingStatus },
      search: { result, fetchingStatus, previousRequestedQuery },
    } = state;
    const q = urlSearchParams.get('q') || undefined;
    const page = urlSearchParams.get('page') || undefined;
    const parsedPage =
      page && !isNaN(parseInt(page)) ? parseInt(page) : undefined;
    if (!q || (parsedPage && parsedPage < 0)) return;

    if (
      q !== previousRequestedQuery &&
      fetchingStatus === 'IDLE' &&
      shiftingStatus === 'IDLE'
    ) {
      dispatch({
        type: 'FETCH_NEW_QUERY__STARTED',
        payload: { query: q },
      });
      performForwardSearch(q).then((result) => {
        if (!parsedPage || parsedPage === 1) {
          dispatch({
            type: 'FETCH_NEW_QUERY__SUCCESS',
            payload: { result },
          });

          return;
        }

        dispatch({
          type: 'FETCH_NEW_QUERY__SUCCESS',
          payload: { result, paginationNeeded: true },
        });
      });
    }

    if (!result) return;

    if (
      parsedPage &&
      parsedPage > 0 &&
      parsedPage !== currentPage &&
      (fetchingStatus === 'IDLE' ||
        fetchingStatus === 'IDLE_PAGINATION_NEEDED') &&
      shiftingStatus === 'IDLE'
    ) {
      const shift = parsedPage - currentPage;
      dispatch({
        type: 'SHIFT_PAGE__STARTED',
        payload: {
          shift,
        },
      });
      const {
        pageInfo: { endCursor, startCursor },
        userCount,
      } = result.data;
      if (shift === 1) {
        dispatch({
          type: 'FETCH_NEW_QUERY__STARTED',
          payload: { query: q },
        });
        performForwardSearch(q, endCursor).then((result) => {
          dispatch({ type: 'FETCH_NEW_QUERY__SUCCESS', payload: { result } });
          dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
        });
      } else if (shift === -1) {
        dispatch({
          type: 'FETCH_NEW_QUERY__STARTED',
          payload: { query: q },
        });
        performBackwardsSearch(q, startCursor).then((result) => {
          dispatch({ type: 'FETCH_NEW_QUERY__SUCCESS', payload: { result } });
          dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
        });
      } else if (shift > 1 && currentPage + shift <= getTotalPages(userCount)) {
        fetchNewCursor(q, USERS_PER_PAGE * (shift - 1), endCursor).then(
          async (cursor) => {
            dispatch({
              type: 'FETCH_NEW_QUERY__STARTED',
              payload: { query: q },
            });
            const result = await performForwardSearch(q, cursor);
            dispatch({ type: 'FETCH_NEW_QUERY__SUCCESS', payload: { result } });
            dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
          }
        );
      } else if (shift < -1 && currentPage + shift >= 1) {
        fetchNewCursor(q, USERS_PER_PAGE * (shift + 1), startCursor).then(
          async (cursor) => {
            dispatch({
              type: 'FETCH_NEW_QUERY__STARTED',
              payload: { query: q },
            });
            const result = await performBackwardsSearch(q, cursor);
            dispatch({
              type: 'FETCH_NEW_QUERY__SUCCESS',
              payload: { result },
            });
            dispatch({ type: 'SHIFT_PAGE__SUCCESS' });
          }
        );
      }
    }
  }, [urlSearchParams, state]);

  const handleQueryChange: InputBaseProps['onChange'] = (e) => {
    const { value: query } = e.target;
    dispatch({ type: 'QUERY_UPDATED', payload: { query } });
  };

  const {
    pagination: { shiftingStatus, requestedPage },
    search: { fetchingStatus, query, result, previousRequestedQuery },
  } = state;
  const queryHasChanged = previousRequestedQuery !== query;
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
                      previousRequestedQuery!
                    )}&page=${page}`
                  );
                }}
              />
            )}
          </>
        )
      )}
    </div>
  );
};
