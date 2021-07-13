const mongoose = require('mongoose');

const bookmarkPattern = "[a-zA-Z0-9'_-]+"; // used in express.get(); limited subset of RegExp
const bookmarkPatternRegex = new RegExp('^' + bookmarkPattern + '$');

const Schema = mongoose.Schema;

const BookmarkSchema = new Schema({
    _id: {
        type: String,
        maxLength: 2047,
        validate: {
            validator: (id) => bookmarkPatternRegex.test(id),
            message: (props) => `${props.value} is not a valid URI, must be alphanumeric or ['_-]`
        },
        required: [true, 'Bookmark page URI is required']
    }, 
    bookmarks: {
        type: [{
            type: String,
            maxLength: 2047
        }],
        required: true
    }
});

BookmarkSchema.virtual('uri').get(() => this._id);

BookmarkSchema.pre('findOneAndUpdate', function(next) {
    this.options.runValidators = true;
    next();
});

module.exports = {
    BookmarkModel: mongoose.model('bookmark', BookmarkSchema, {collection: 'bookmarks', timestamps: true}),
    bookmarkPattern: bookmarkPattern
};