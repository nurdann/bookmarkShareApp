import { useEffect, useState } from "react";

async function fetchBookmarks(bookmarkName : string) : Promise<string[]> {
    const result = await fetch(`/api/bookmark/${bookmarkName}`);
    if(result?.status === 200) {
        return await result.json();
    } else {
        return [];
    }
}

function Bookmarks() {
    // assume the component is reachable only for paths starting with `/`
    const bookmarkName : string = document.location.pathname.substring(1);
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    useEffect(() => {
        const asyncSetBookmarks = async() => {
            setBookmarks(await fetchBookmarks(bookmarkName));
        };
        asyncSetBookmarks();
    }, [bookmarkName]);

    return (
        <>
        <h1>Bookmarks</h1>
        <ul className="bookmark-list">
            {bookmarks.map((bookmark, key) => (
                <li key={key}>{bookmark}</li>
            ))}
        </ul>
        </>
    );
}

export default Bookmarks;