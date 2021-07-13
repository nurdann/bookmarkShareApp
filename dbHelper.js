const mongoose = require('mongoose');
require('./bookmarkModel'); // register 'bookmark' model
require('dotenv').config();

async function exists(model, URI) {
    const found = await model.findById(URI, '_id').exec();

    return found ? true : false;
}

async function getBookmarks(model, URI) {
    return await model.findById(URI).exec();
}

async function dropBookmarks(model, URI) {
    if(!await exists(model, URI))  {
        return true;
    }

    const removed = await model.findByIdAndRemove(URI);

    return removed ? true : false;
}

async function addBookmark(model, URI, bookmarkURI) {
    if(!await exists(model, URI)) { 
        const created = model.create({
            _id: URI,
            bookmarks: [bookmarkURI]
        });

        if(created) {
            return true;
        } else {
            return false;
        }
     }

    const updatedBookmark = await model.findByIdAndUpdate(URI, {
        $push: {
            bookmarks: {
                $each: [bookmarkURI],
                $slice: -1000 // keep only the latest 1000 items
            }
        }
    });

    return updatedBookmark ? true : false;
}

async function removeBookmarkItem(model, URI, bookmarkURI) {
    if(!await exists(model, URI))  {
        return true;
    }
    
    const removed = await model.findByIdAndUpdate(URI, {
        $pull: {bookmarks: bookmarkURI}
    });

    return removed ? true : false;
}

async function operationWithModel(operation) {
    if(!process.env.MONGODB_URI) {
        console.log('Unable to retrieve connection string for MongoDB');
        return false;
    }

    const db = mongoose.createConnection(process.env.MONGODB_URI, {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false
    });

    const Bookmarks = db.model('bookmark');

    //Bind connection to error event (to get notification of connection errors)
    Bookmarks.on('error', console.error.bind(console, 'MongoDB connection error: '));

    return operation(Bookmarks);
}

module.exports = {
    operationWithModel,
    getBookmarks,
    dropBookmarks,
    addBookmark,
    removeBookmarkItem,
    exists
}