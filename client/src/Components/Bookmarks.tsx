import React from 'react';
import TrashIcon from '../Icons/TrashIcon';
import {
    getBookmarksFromUri,
    addBookmarkToUriAndFetch,
    removeBookmarkItemFromUriAndFetch,
    removeBookmarksFromUri 
} from './BookmarksHelper';

// Define React Component

type bookmarkStates = {
    bookmarkPage : string,
    bookmarks : string[],
    newBookmark : string
}
class Bookmarks extends React.Component<{}, bookmarkStates> {
    state = {
        bookmarkPage: document.location.pathname.substring(1),
        bookmarks: [],
        newBookmark: ''
    }

    componentDidMount() : void {
        getBookmarksFromUri(this.state.bookmarkPage).then((resolvedBookmarks) => {
            this.setState({bookmarks: resolvedBookmarks});
        });
    }

    onSubmitAddBookmark = (event : React.MouseEvent<HTMLElement>) : void => {
        event.preventDefault();
        const inputElement = document.getElementById('add-bookmark-input') as HTMLInputElement;
        const newBookmark : string = inputElement.value;
        inputElement.value = ''; // Empty input field
        addBookmarkToUriAndFetch(this.state.bookmarkPage, newBookmark).then((updatedBookmarks) => {
            this.setState({bookmarks: updatedBookmarks});
        });
    }

    removeBookmarkItem = (event : React.MouseEvent<HTMLElement>) : void => {
        event.preventDefault();
        const element = event.target as HTMLButtonElement;
        if(element) {
            const rmBookmark : string | null = element.getAttribute('data-bookmark');
            if(rmBookmark) {
                removeBookmarkItemFromUriAndFetch(this.state.bookmarkPage, rmBookmark).then((updatedBookmarks) => {
                    this.setState({bookmarks: updatedBookmarks});
                });
            }
        }
    }

    removeBookmarks = (event : React.MouseEvent<HTMLElement>) : void => {
        event.preventDefault();
        removeBookmarksFromUri(this.state.bookmarkPage).then(isRemoved => {
            if(isRemoved) {
                this.setState({bookmarks: []});
            }
        });
    }

    render() {
        return (
        <>
            <form id="add-form" className="form-input-button">
                <input type="text" id="add-bookmark-input" placeholder="Add bookmark" />
                <button onClick={this.onSubmitAddBookmark}>Add</button>
                <button onClick={this.removeBookmarks}>
                    <TrashIcon />
                </button>
            </form>
            

            <ul className="bookmark-list">
                {this.state.bookmarks.map((bookmark, key) => 
                    <li key={key}>
                        <div className="bookmark-display">
                            <div>{bookmark}</div>
                        </div>
                        <div className="button-cluster">
                            <button>Copy</button>
                            <button onClick={this.removeBookmarkItem} data-bookmark={bookmark}>
                                <TrashIcon />
                                </button>
                        </div>
                    </li>
                )}
            </ul>
        </>);
    }
}

export default Bookmarks;