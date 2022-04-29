import React from "react";

import { Action, State } from "./types";

export const reducer: React.Reducer<State, Action> = (state, action) => {
  const { pagination, search } = state;

  switch (action.type) {
    case 'FETCH_NEW_QUERY__REQUESTED': {
      const { query } = action.payload;
      return {
        pagination: { ...pagination, currentPage: 1, requestedPage: 1 },
        search: { ...search, fetchingStatus: 'REQUESTED', query },
      };
    }

    case 'FETCH_NEW_QUERY__STARTED': {
      return {
        ...state,
        search: { ...search, fetchingStatus: 'IN_PROGRESS' },
      };
    }

    case 'FETCH_NEW_QUERY__SUCCESS': {
      const { result, setFirstPage, paginationNeeded } = action.payload;
      if (setFirstPage) {
        return {
          pagination: { ...pagination, currentPage: 1, requestedPage: 1 },
          search: { ...search, fetchingStatus: 'IDLE', result },
        };
      }
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
        search: { ...search, fetchingStatus: 'IDLE', result },
      };
    }

    case 'SHIFT_PAGE__REQUESTED': {
      const { shift } = action.payload;

      return {
        ...state,
        pagination: {
          ...pagination,
          shiftingStatus: 'REQUESTED',
          requestedPage: pagination.currentPage + shift,
        },
      };
    }

    case 'SHIFT_PAGE__STARTED': {
      return {
        ...state,
        pagination: {
          ...pagination,
          shiftingStatus: 'IN_PROGRESS',
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
        ...state,
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