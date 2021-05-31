import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import HomePage from './Pages/HomePage';
import BookmarkPage from './Pages/BookmarkPage';

function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <nav>Nav</nav>
        <div className='page-body'>
          <Switch>
            // Use 'exact' attribute to disable prefix matching
            <Route path='/' component={HomePage} exact />
            <Route component={BookmarkPage} />
          </Switch>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
