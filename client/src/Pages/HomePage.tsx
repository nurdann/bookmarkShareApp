import React from "react";

function forwardToBookmarkPage (event : React.MouseEvent<HTMLElement>) {
    event.preventDefault();
    // ?. is for optional chaining
    const bookmark : string | null | undefined = (document.getElementById('input-bookmark') as HTMLInputElement)?.value;
    if(bookmark) {
        document.location.href = '/' + bookmark;
    }
};

const HomePage = () => {

    return (
        <>
        <form name='bookmark'>
            <input type='text' id='input-bookmark' placeholder='Enter bookmark name...'/>
            <button onClick={(e) => forwardToBookmarkPage(e)}>Go</button>
        </form>
        </>
    );
};

export default HomePage;