const mongoose = require('mongoose');
require('./bookmarkModel'); // register 'bookmark' model
require('dotenv').config();

async function exists(model, URI) {
    const found = await model.findById(URI, '_id').exec();
    if(found) {
        return true;
    }
    return false;
}

async function getBookmarks(model, URI) {
    return await model.findById(URI).exec();
}

async function dropBookmarks(model, URI) {
    if(!await exists(model, URI))  {
        return true;
    }

    const removed = await model.findByIdAndRemove(URI);
    if(removed) {
        return true;
    } else {
        return false;
    }
}

async function addBookmark(model, URI, bookmarkURI) {
    if(!await exists(model, URI)) { 
        const created = await model.create({
            _id: URI,
            bookmarks: [bookmarkURI]
        });
        if(!created) {
            return false;
        }
     }

    const updatedBookmark = await model.findByIdAndUpdate(URI, {
        $push: {bookmarks: bookmarkURI}
        });

    if(updatedBookmark) {
        return true;
    } else {
        return false;
    }
}

async function removeBookmark(model, URI, bookmarkURI) {
    if(!await exists(model, URI))  {
        return true;
    }
    
    const removed = await model.findByIdAndUpdate(URI, {
        $pull: {bookmarks: bookmarkURI}
    });

    if(removed) {
        return true;
    } else {
        return false;
    }
}


async function operationWithModel(operation) {
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
    removeBookmark,
    exists
}