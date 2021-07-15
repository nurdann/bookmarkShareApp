
// Define API helper functions

export async function getBookmarksFromUri(bookmarkPage : string) : Promise<Array<[string, string, string]>> {
    const result = await fetch(`/api/bookmark/${bookmarkPage}`);
    if(result?.status === 200) {
        return await result.json();
    } else {
        return [];
    }
}

export async function addBookmarkToUriAndFetch(bookmarkPage : string, newBookmark : string) : Promise<Array<[string, string, string]>> {
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

export async function removeBookmarkItemFromUriAndFetch(bookmarkPage : string, rmBookmark : string) : Promise<Array<[string, string, string]>> {
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

export async function removeBookmarksFromUri(bookmarkPage : string) : Promise<boolean> {
    const result = await fetch(`/api/bookmark/${bookmarkPage}/remove`, {
        method: 'POST'
    });

    if(result?.status === 200) {
        return true;
    } else {
        return false;
    }
}