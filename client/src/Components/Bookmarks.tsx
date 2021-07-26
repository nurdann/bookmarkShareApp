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
    bookmarks : Array<[string, string, string]>,
}

class Bookmarks extends React.Component<{}, bookmarkStates> {
    state = {
        bookmarkPage: document.location.pathname.substring(1),
        bookmarks: [],
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

    removeBookmarkItem = (bookmark : string) : void => {
        if(bookmark) {
            removeBookmarkItemFromUriAndFetch(this.state.bookmarkPage, bookmark).then((updatedBookmarks) => {
                this.setState({bookmarks: updatedBookmarks});
            });
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

    copyBookmarkToClipboardOrSelect = (bookmark : string, event : React.MouseEvent<HTMLElement>) : void => {
        // source: https://stackoverflow.com/a/30810322/1374078
        if(navigator.clipboard) {
            navigator.clipboard.writeText(bookmark);
        } else {
            const getSiblingByClass = function(classname : string, element : HTMLElement) {
                const children = Array.from(element?.children) as Array<HTMLElement>;
                for(let i = 0; i < children?.length; i++) {
                    if(children[i].classList.contains(classname)) {
                        return children[i];
                    }
                }
                return null;
            };
            const parent = (event.target as HTMLElement).parentNode as HTMLElement;
            const focusParentElement = getSiblingByClass('bookmark-display', parent.parentNode as HTMLElement) as HTMLElement;
            
            // source: https://stackoverflow.com/a/2838358/1374078
            const selectElement = focusParentElement.querySelector('.bookmark-url') as HTMLElement;
            const selection = window.getSelection();
            const range = document.createRange();

            range.selectNodeContents(selectElement);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
    }

    render() {
        return (
        <>
            <form id="add-form" className="form-input-button">
                <input type="text" id="add-bookmark-input" placeholder="Add bookmark" />
                <div className="button-cluster">
                    <button onClick={this.onSubmitAddBookmark}>Add</button>
                    <button onClick={this.removeBookmarks} className="delete-all-bookmarks">
                        <TrashIcon />
                    </button>
                </div>
            </form>
            

            <ul className="bookmark-list">
                {this.state.bookmarks.map((entry, key) => {
                    //console.log(entry);
                    const [bookmark, title, favicon] = entry;
                    
                    return (
                    <li key={key}>
                        <div className="bookmark-display">
                            {favicon && <img src={favicon} alt="" className="bookmark-icon"/> }
                            <div className="bookmark-content">
                                {title && <h4 className="bookmark-title">
                                    <a href={bookmark}>{title}</a>
                                </h4>}
                                <div className="bookmark-url">{bookmark}</div>
                            </div>
                        </div>
                        <div className="button-cluster">
                            <button onClick={(e) => this.copyBookmarkToClipboardOrSelect(bookmark, e)}>Copy</button>
                            <button onClick={() => this.removeBookmarkItem(bookmark)}> 
                                <TrashIcon />
                            </button>
                        </div>
                    </li>
                    );
                    }
                )}
            </ul>
        </>);
    }
}

export default Bookmarks;