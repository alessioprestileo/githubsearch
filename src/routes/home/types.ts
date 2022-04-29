import { User } from '../../components/user-card/UserCard';

export interface PageInfo {
  startCursor: string;
  endCursor: string;
}

export interface SearchResult {
  data: {
    users: User[];
    userCount: number;
    pageInfo: PageInfo;
  };
}

export interface PaginationState {
  shiftingStatus: 'IDLE' | 'IN_PROGRESS';
  currentPage: number;
  requestedPage: number;
}

export interface SearchState {
  fetchingStatus: 'IDLE' | 'IN_PROGRESS' | 'IDLE_PAGINATION_NEEDED';
  previousRequestedQuery: string | undefined;
  query: string | undefined;
  result: SearchResult | undefined;
}

export interface State {
  pagination: PaginationState;
  search: SearchState;
}
interface FetchNewQueryStarted {
  type: 'FETCH_NEW_QUERY__STARTED';
  payload: { query: string };
}

interface FetchNewQuerySuccess {
  type: 'FETCH_NEW_QUERY__SUCCESS';
  payload: {
    result: SearchResult;
    paginationNeeded?: boolean;
  };
}

interface ShiftPageStarted {
  type: 'SHIFT_PAGE__STARTED';
  payload: { shift: number };
}

interface ShiftPageSuccess {
  type: 'SHIFT_PAGE__SUCCESS';
}

interface QueryUpdated {
  type: 'QUERY_UPDATED';
  payload: { query: string };
}

export type Action =
  | FetchNewQueryStarted
  | FetchNewQuerySuccess
  | ShiftPageStarted
  | ShiftPageSuccess
  | QueryUpdated;
