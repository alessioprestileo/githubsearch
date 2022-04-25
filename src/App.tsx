import React, { useRef, useState } from 'react';
import Paper from '@mui/material/Paper';
import InputBase, { InputBaseProps } from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

import './App.css';

function App() {
  const [query, setQuery] = useState<string>('');
  const queryRef = useRef(query);
  const [searchResult, setSearchResult] = useState<any>(undefined);
  const handleQueryChange: InputBaseProps['onChange'] = (e) => {
    const { value } = e.target;
    setQuery(value);
  };
  const handleNewSearch: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    queryRef.current = query;
    fetch(`/.netlify/functions/github-users-graphql?q=${query}`)
      .then((res) => res.json())
      .then((result) => setSearchResult(result));
  };
  const queryHasChanged = query !== queryRef.current;

  return (
    <div className="app">
      <div>
        <Paper
          component="form"
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: 400,
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
            onClick={handleNewSearch}
            disabled={!(query && queryHasChanged)}
          >
            <SearchIcon />
          </IconButton>
        </Paper>
        <div className="search-summary">
          {searchResult && (
            <>
              <div className="search-total">
                Found {searchResult.data.userCount} users
              </div>
              <ul className="search-items">
                {searchResult.data.users.map((item: any) => (
                  <li key={item.id}>{item.login}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
