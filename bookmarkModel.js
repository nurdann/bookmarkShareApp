const mongoose = require('mongoose');

const bookmarkPattern = "[a-zA-Z0-9'_-]+"; // used in express.get(); limited subset of RegExp
const bookmarkPatternRegex = new RegExp('^' + bookmarkPattern + '$');

const Schema = mongoose.Schema;

const BookmarkSchema = new Schema({
    _id: {
        type: String,
        maxLength: 2047,
        validate: (s) => { bookmarkPatternRegex.test(s) },
        message: (bookmarkUri) => `{props.value} is not a valid URI, must be alphanumeric or ['_-]`,
        required: [true, 'Bookmark page URI is required']
    }, 
    bookmarks: {
        type: [{
            type: String,
            maxLength: 2047
        }],
        validate: [(s) => s.length <= 100, '{PATH} exceeds the limit of 100']
    }
});

BookmarkSchema.virtual('uri').get(() => this._id);

module.exports = {
    BookmarkModel: mongoose.model('bookmark', BookmarkSchema, {collection: 'bookmarks', timestamps: true}),
    bookmarkPattern: bookmarkPattern
};