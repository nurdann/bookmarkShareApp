import React, { ReactComponentElement, useEffect, useState } from "react";

// Define API helper functions

async function getBookmarksFromUri(bookmarkPage : string) : Promise<string[]> {
    const result = await fetch(`/api/bookmark/${bookmarkPage}`);
    if(result?.status === 200) {
        return await result.json();
    } else {
        return [];
    }
}

async function addBookmarkToUriAndFetch(bookmarkPage : string, newBookmark : string) : Promise<string[]> {
    const result = await fetch(`/api/bookmark/${bookmarkPage}/add`, {
        method: 'POST',
        body: JSON.stringify({
            newBookmark: newBookmark
        }),
        headers: {
            'Content-type': 'application/json'
        }
    });

    if(result?.status === 200) {
        return await result.json();
    } else {
        return [];
    }
}

async function removeBookmarkItemFromUriAndFetch(bookmarkPage : string, rmBookmark : string) : Promise<string[]> {
    const result = await fetch(`/api/bookmark/${bookmarkPage}/remove-item`, {
        method: 'POST',
        body: JSON.stringify({
            rmBookmark: rmBookmark
        }),
        headers: {
            'Content-type': 'application/json'
        }
    });

    if(result?.status === 200) {
        return await result.json();
    } else {
        return [];
    }

}

async function removeBookmarksFromUri(bookmarkPage : string) : Promise<boolean> {
    const result = await fetch(`/api/bookmark/${bookmarkPage}/remove`, {
        method: 'POST'
    });

    if(result?.status === 200) {
        return true;
    } else {
        return false;
    }
}

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
        console.log(this.state.bookmarkPage);
        const inputElement = document.getElementById('add-bookmark-input') as HTMLInputElement;
        const newBookmark : string = inputElement.value;
        inputElement.value = ''; // Empty input field
        addBookmarkToUriAndFetch(this.state.bookmarkPage, newBookmark).then((updatedBookmarks) => {
            this.setState({bookmarks: updatedBookmarks});
        });
    }

    removeBookmarkItem = (event : React.MouseEvent<HTMLElement>) : void => {
        event.preventDefault();
        console.log(this.state.bookmarkPage);
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
        console.log(this.state.bookmarkPage);
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
            </form>
            <button onClick={this.removeBookmarks}>Remove all bookmarks</button>
            <ul>
                {this.state.bookmarks.map((bookmark, key) => 
                    <li key={key}>
                        <div>
                            <h4>title</h4>
                            <div>{bookmark}</div>
                        </div>
                        <button onClick={this.removeBookmarkItem} data-bookmark={bookmark}>Delete</button>
                    </li>
                )}
            </ul>
        </>);
    }
}

export default Bookmarks;