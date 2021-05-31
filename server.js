const express = require('express');
const cors = require('cors');
const { bookmarkPattern } = require('./bookmarkModel');
const { 
    exists,
    operationWithModel,
    getBookmarks,
    dropBookmarks,
    addBookmark,
    removeBookmark } = require('./dbHelper');

const app = express();

app.use(cors());
app.use(express.json());

// This middleware informs the express application to serve our compiled React files
// Source: https://medium.com/weekly-webtips/create-and-deploy-your-first-react-web-app-with-a-node-js-backend-ec622e0328d7
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
};

app.get('^/api/bookmark/:uri(' + bookmarkPattern + ')', async (request, response) => {
    const uri = request.params.uri;
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
        response.status(400).json('Unable to retrive bookmarks for ' + uri);
    }
});

app.post(`^/api/bookmark/:uri(${bookmarkPattern})/add`, async (request, response) => {
    const uri = request.params.uri;
    const {newBookmark} = request.body;

    const isAdded = await operationWithModel(async model => await addBookmark(model, uri, newBookmark));

    if(isAdded) {
        response.status(200).json({'message': `Added bookmark ${newBookmark} to ${uri}`});
    } else {
        response.status(400).json({'message': `Unable to add bookmark ${newBookmark} to ${uri}`});
    }
});

app.post(`^/api/bookmark/:uri(${bookmarkPattern})/remove`, async (request, response) => {
    const uri = request.params.uri;

    const isDropped = await operationWithModel(async model => await dropBookmarks(model, uri));

    if(isDropped) {
        response.status(200).json({'message': `Dropped bookmarks on ${uri}`});
    } else {
        response.status(400).json({'message': `Unable to drop bookmarks on ${uri}`});
    }
});

app.post(`^/api/bookmark/:uri(${bookmarkPattern})/remove-item`, async (request, response) => {
    const uri = request.params.uri;
    const {newBookmark} = request.body;

    const isRemoved = await operationWithModel(async model => await removeBookmark(model, uri, newBookmark));

    if(isRemoved) {
        response.status(200).json({'message': `Removed bookmark ${newBookmark} from ${uri}`});
    } else {
        response.status(400).json({'message': `Unable to remove bookmark ${newBookmark} from ${uri}`});
    }
});

app.get('*', (request, response) => {
    response.status(404).json({'message': 'Unknown API call'});
});


app.listen(process.env.API_PORT, (err) => {
    if(!err) {
        console.log('Listening on port ' + process.env.API_PORT);
    } else {
        console.log(err);
    }
})