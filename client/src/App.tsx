import './App.css';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import HomePage from './Pages/HomePage';
import BookmarkPage from './Pages/BookmarkPage';
import NavComponent from './Components/NavComponent';

function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <NavComponent />
        <div className='page-body'>
          <Switch>
            <Route path='/' component={HomePage} exact />
            <Route component={BookmarkPage} />
          </Switch>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
