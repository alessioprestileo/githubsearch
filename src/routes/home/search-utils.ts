import { MAX_CURSOR_SHIFT, USERS_PER_PAGE } from './constants';
import { PageInfo, SearchResult } from './types';

interface MoveCursorPageInfo extends PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

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

export const fetchNewCursor = async (
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

export const performForwardSearch = (
  query: string,
  after?: string
): Promise<SearchResult> =>
  fetch(
    `/.netlify/functions/github-users-search?q=${encodeURIComponent(
      query
    )}&first=${USERS_PER_PAGE}${`${after ? `&after=${after}` : ''}`}`
  ).then((res) => res.json());

export const performBackwardsSearch = (
  query: string,
  before: string
): Promise<SearchResult> =>
  fetch(
    `/.netlify/functions/github-users-search?q=${encodeURIComponent(
      query
    )}&last=${USERS_PER_PAGE}&before=${before}`
  ).then((res) => res.json());
