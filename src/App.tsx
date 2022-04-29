import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import './App.css';
import { Home } from './routes/home/Home';

export const App = () => (
  <div className="app">
    <Router>
      <Home />
    </Router>
  </div>
);
