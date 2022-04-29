import { User } from "../../components/user-card/UserCard";

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
  shiftingStatus: 'IDLE' | 'REQUESTED' | 'IN_PROGRESS';
  currentPage: number;
  requestedPage: number;
}

export interface SearchState {
  fetchingStatus:
    | 'IDLE'
    | 'REQUESTED'
    | 'IN_PROGRESS'
    | 'IDLE_PAGINATION_NEEDED';
  query: string | undefined;
  result: SearchResult | undefined;
}

export interface State {
  pagination: PaginationState;
  search: SearchState;
}

interface FetchNewQueryRequested {
  type: 'FETCH_NEW_QUERY__REQUESTED';
  payload: { query: string };
}
interface FetchNewQueryStarted {
  type: 'FETCH_NEW_QUERY__STARTED';
}

interface FetchNewQuerySuccess {
  type: 'FETCH_NEW_QUERY__SUCCESS';
  payload: {
    result: SearchResult;
    paginationNeeded?: boolean;
    setFirstPage?: boolean;
  };
}

interface ShiftPageRequested {
  type: 'SHIFT_PAGE__REQUESTED';
  payload: { shift: number };
}

interface ShiftPageStarted {
  type: 'SHIFT_PAGE__STARTED';
}

interface ShiftPageSuccess {
  type: 'SHIFT_PAGE__SUCCESS';
}

interface QueryUpdated {
  type: 'QUERY_UPDATED';
  payload: { query: string };
}

export type Action =
  | FetchNewQueryRequested
  | FetchNewQueryStarted
  | FetchNewQuerySuccess
  | ShiftPageRequested
  | ShiftPageStarted
  | ShiftPageSuccess
  | QueryUpdated;