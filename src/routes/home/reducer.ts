import React from 'react';

import { Action, State } from './types';

export const reducer: React.Reducer<State, Action> = (state, action) => {
  const { pagination, search } = state;

  switch (action.type) {
    case 'FETCH_NEW_QUERY__STARTED': {
      const { query } = action.payload;
      return {
        ...state,
        search: { ...search, fetchingStatus: 'IN_PROGRESS', query },
      };
    }

    case 'FETCH_NEW_QUERY__SUCCESS': {
      const { result, paginationNeeded } = action.payload;
      if (paginationNeeded) {
        return {
          ...state,
          search: {
            ...search,
            fetchingStatus: 'IDLE_PAGINATION_NEEDED',
            result,
          },
        };
      }
      return {
        ...state,
        search: {
          ...search,
          fetchingStatus: 'IDLE',
          result,
          previousRequestedQuery: search.query,
        },
      };
    }

    case 'SHIFT_PAGE__STARTED': {
      const { shift } = action.payload;

      return {
        ...state,
        pagination: {
          ...pagination,
          shiftingStatus: 'IN_PROGRESS',
          requestedPage: pagination.currentPage + shift,
        },
      };
    }

    case 'SHIFT_PAGE__SUCCESS': {
      if (search.fetchingStatus === 'IDLE_PAGINATION_NEEDED') {
        return {
          pagination: {
            ...pagination,
            shiftingStatus: 'IDLE',
            currentPage: pagination.requestedPage,
          },
          search: { ...state.search, fetchingStatus: 'IDLE' },
        };
      }
      return {
        search: { ...search, previousRequestedQuery: search.query },
        pagination: {
          ...pagination,
          shiftingStatus: 'IDLE',
          currentPage: pagination.requestedPage,
        },
      };
    }

    case 'QUERY_UPDATED': {
      const { query } = action.payload;
      return { ...state, search: { ...state.search, query } };
    }
  }
};
