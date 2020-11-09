module.exports = {
    notes: async (parent, args, { models }) => {
        // limit the amount that can be requested  to prevent queries that can overload our server or database
        return await models.Note.find().limit();
    },
    note: async (parent, args, { models }) => {
        return await models.Note.findById(args.id);
    },
    user: async(parent, { username }, { models }) => {
        // find a user given their username
        return await models.User.findOne({ username })
    },
    users: async (parent, args, { models }) => {
        // find all users
        return await models.User.find();
    },
    me: async(parent, args, { models, user }) => {
        // find a user given the current user context
        return await models.User.findById(user.id);
    },
    noteFeed: async(parent, { cursor }, { models }) => {
        // hardcode limit to 100 items
        const limit = 10;

        let hasNextPage = false;

        // if no cursor is passed the default query will be empty
        let cursorQuery = {};

        // if there is a cursor
        // our query will look ofr notes with an ObjectId less than that of the cursor
        if (cursor) {
            cursorQuery = { _id: { $lt: cursor } };
        }

        // find the limit + 1 of notes in our database sorted from newest to oldest
        let notes = await models.Note.find(cursorQuery)
            .sort({ _id: -1 })
            .limit(limit + 1)

        //if number is greater than ten set nextpage true and trim notes to limit
        if (notes.length > limit) {
            hasNextPage: true;
            notes = notes.slice(0, -1)
        }

        // the cursor will be the last object id of the last item in the feed array
        const newCursor = notes[notes.length - 1]._id;

        return {
            notes,
            cursor: newCursor,
            hasNextPage
        };
    }
}
