const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { bookmarkPattern } = require('./bookmarkModel');
const { 
    exists,
    operationWithModel,
    getBookmarks,
    dropBookmarks,
    addBookmark,
    removeBookmarkItem } = require('./dbHelper');

const app = express();

app.use(cors());
app.use(express.json());

// Define functions for endpoints

async function fetchBookmarksFromURI(request, response) {
    const uri = request.params.uri; 
    const bookmarks = await operationWithModel(async model => {
        if(await exists(model, uri)) {
            const obj = await getBookmarks(model, uri);
            if(obj !== null) {
                return obj.bookmarks;
            } else {
                return [];
            }
        } else {
            return [];
        }
    });

    const bookmarksWithTitleAndIcon = await addTitlesAndIcons(bookmarks);

    if(bookmarks) {
        response.status(200).json(bookmarksWithTitleAndIcon);
    } else {
        response.status(400).json({'message': 'Unable to retrive bookmarks for ' + uri});
    }
}

async function addTitlesAndIcons(bookmarks) {
    // Return promises in parallel
    // source: https://stackoverflow.com/a/37576787
    return Promise.all(bookmarks.map(async (bookmark) => {
        return await getTitleAndIcon(bookmark);
    }));
}

// Treat bookmark as a URL to fetch HTML file and look for <title> and <link> tags to extract website title and icon location
// If <link rel="icon"> does not exist, check for /favicon.ico file
async function getTitleAndIcon(bookmark) {
    // for checking URL
    // source: https://stackoverflow.com/a/43467144/1374078
    const isUrl = function(url) {
        try {
            new URL(url);
            return true;
        } catch(e) {
            return false;
        }
    }

    if(!isUrl(bookmark)) {
        return [bookmark, '', ''];
    }

    const origin = (new URL(bookmark)).origin;

    const response = await axios(bookmark);
    if(response.status == 200) {
        const html = response.data;
        // match first shortest title tag
        const titleRegex = /<title.*?>(.*?)<\/title>/;
        let title = titleRegex.exec(html);

        let titleStr = '';
        let faviconStr = parseFaviconElement(html);

        if(title !== null) { 
            titleStr = title[1]; 
        }
        
        if(faviconStr !== '') { 
            if(!isUrl(faviconStr)) {
                faviconStr = origin + faviconStr;
            }
        } else { 
            faviconStr = await getDefaultFavicon(origin); 
        }

        return [bookmark, titleStr, faviconStr];
    } else {
        return [bookmark, '', ''];
    }
}

function parseFaviconElement(html) {
    // e.g. 
    // <link rel="icon" href="">
    // <link rel="shortcut icon" href="">
    // Regex is not adequate if there are other attributes or their order change
    // const faviconRegex = /<link\s+rel="(shortcut)?\s*icon"\s*href="(.*?)"\s*?\/?>/;
    /*
        element -> < name { attr (= " val ")? } >
    */
    const isWhitespace = (char) => {
        return /\s/.test(char);
    }

    const isAlpha = (char) => {
        return /[0-9a-zA-Z]/.test(char);
    }

    const parseAttrs = (html, cursor, acc) => {
        while(cursor < html.length && html[cursor] !== '>') {

            // skip whitespace
            while(cursor < html.length && isWhitespace(html[cursor])) {
                cursor++;
            }

            // get attribute name
            let attrName = "";
            while(cursor < html.length && isAlpha(html[cursor])) {
                attrName += html[cursor];
                cursor++;
            }

            if(cursor + 1 >= html.length || html[cursor] !== "=") {
                cursor++;
                continue;
            }

            cursor++; // consume '='

            if(html[cursor] === '"') {
                cursor++; // consume opening '"'
                let attrVal = "";
                while(cursor < html.length && html[cursor] !== '"') {
                    attrVal += html[cursor];
                    cursor++;
                }

                cursor++; // consume closing '"'
                acc[attrName] = attrVal;
            } else {
                cursor++;
            }
        }

        return cursor;
    }

    let cursor = 0;
    while(cursor < html.length) {
        // look for only opening HTML tags
        if(cursor + 1 < html.length && html[cursor] === "<" && html[cursor + 1] !== '/') {
            cursor++; // consume '<'
            let tagname = "";
            while(cursor < html.length && isAlpha(html[cursor])) {
                tagname += html[cursor];
                cursor++;
            }

            if(tagname === "link") {
                const attrs = {};
                cursor = parseAttrs(html, cursor, attrs);
                // e.g. <link rel="shortcut icon" href="">
                if("rel" in attrs && "href" in attrs 
                    && (attrs["rel"] === "icon" || attrs["rel"] === "shortcut icon")) {
                    return attrs["href"];
                }
            }
           
        }
        cursor++;
    }

    return "";
}

async function getDefaultFavicon(url) {
    const favicon = url + '/favicon.ico';

    const fileExists = async function(url) {
            const response = await axios(url, {method: 'HEAD'});
            return response.status === 200;
    };

    if(await fileExists(favicon)) {
        return favicon;
    } else {
        return null;
    }
}

async function addBookmarkToURI(request, response) {
    const uri = request.params.uri;
    const {newBookmark} = request.body;

    const isAdded = await operationWithModel(async model => await addBookmark(model, uri, newBookmark));

    if(isAdded) {
        fetchBookmarksFromURI(request, response);
    } else {
        response.status(400).json({'message': `Unable to add bookmark ${newBookmark} to ${uri}`});
    }
}

async function removeBookmarksFromURI(request, response) {
    const uri = request.params.uri;
    const isDropped = await operationWithModel(async model => await dropBookmarks(model, uri));

    if(isDropped) {
        fetchBookmarksFromURI(request, response);
    } else {
        response.status(400).json({'message': `Unable to drop bookmarks on ${uri}`});
    }
}

async function removeBookmarkItemFromURI(request, response) {
    const uri = request.params.uri;

    const {rmBookmark} = request.body;

    const isRemoved = await operationWithModel(async model => await removeBookmarkItem(model, uri, rmBookmark));

    if(isRemoved) {
        fetchBookmarksFromURI(request, response);
    } else {
        response.status(400).json({'message': `Unable to remove bookmark ${newBookmark} from ${uri}`});
    }
}

// Define endpoints
app.get(`^/api/bookmark/:uri(${bookmarkPattern})`, fetchBookmarksFromURI);

app.post(`^/api/bookmark/:uri(${bookmarkPattern})/add`, addBookmarkToURI);

app.post(`^/api/bookmark/:uri(${bookmarkPattern})/remove`, removeBookmarksFromURI);

app.post(`^/api/bookmark/:uri(${bookmarkPattern})/remove-item`, removeBookmarkItemFromURI);

app.listen(process.env.API_PORT || 8000, (err) => {
    if(!err) {
        console.log('Listening on port ' + (process.env.API_PORT || 8000));
    } else {
        console.log(err);
    }
});

// This middleware informs the express application to serve our compiled React files
// Source: https://medium.com/weekly-webtips/create-and-deploy-your-first-react-web-app-with-a-node-js-backend-ec622e0328d7
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get(`/(${bookmarkPattern})?`, function (req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
} 
// Wildcard place at the end
app.get('*', (request, response) => {
    response.status(404).json({'message': 'Unknown API call'});
});
