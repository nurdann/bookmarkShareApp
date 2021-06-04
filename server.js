const express = require('express');
const cors = require('cors');
const path = require('path');
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

function isURICorrect(connectionString) {
    const isNameRegex = /^[a-zA-Z0-9'_-]+$/;
    return isNameRegex.test(connectionString);
}

async function fetchBookmarksFromURI(request, response) {
    const uri = request.params.uri; 
    if(!isURICorrect(uri)) {
        response.status(400).json({'message': `Unable to add match regex pattern to ${uri}`});
    }

    const bookmarks = await operationWithModel(async model => {
        if(await exists(model, uri)) {
            return (await getBookmarks(model, uri))?.bookmarks;
        } else {
            return [];
        }
    });
    if(bookmarks) {
        response.status(200).json(bookmarks);
    } else {
        response.status(400).json({'message': 'Unable to retrive bookmarks for ' + uri});
    }
}

async function addBookmarkToURI(request, response) {
    const uri = request.params.uri;
    if(!isURICorrect(uri)) {
        response.status(400).json({'message': `Unable to add match regex pattern to ${uri}`});
    }

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
    if(!isURICorrect(uri)) {
        response.status(400).json({'message': `Unable to add match regex pattern to ${uri}`});
    }

    const isDropped = await operationWithModel(async model => await dropBookmarks(model, uri));

    if(isDropped) {
        fetchBookmarksFromURI(request, response);
    } else {
        response.status(400).json({'message': `Unable to drop bookmarks on ${uri}`});
    }
}

async function removeBookmarkItemFromURI(request, response) {
    const uri = request.params.uri;
    if(!isURICorrect(uri)) {
        response.status(400).json({'message': `Unable to add match regex pattern to ${uri}`});
    }

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

    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
} else {
    // Wildcard place at the end
    app.get('*', (request, response) => {
        response.status(404).json({'message': 'Unknown API call'});
    });
}
