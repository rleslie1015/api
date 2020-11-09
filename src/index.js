const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
app.use(helmet());
app.use(cors());

// modules to help set limits and keep our server from being overloaded 
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity'); 

// Apollo server enables us to serve data as a graphql API from a Node.js application.
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const db = require('./db');
const models = require('./models');

const jwt = require('jsonwebtoken');

// get the user info from a JWT
const getUser = token => {
    if (token) {
        try {
            //return the user info from the token
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // if there is a problem with the token, throw an error
            throw new Error('Session Invalid');
        }
    }
}

require('dotenv').config();

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    validationRules: [ depthLimit(5), createComplexityLimitRule(1000)],
    context: ({ req }) => {
        // get the user token from the headers
        const token = req.headers.authorization;
        // try to retrieve a user with the token
        const user = getUser(token);
        // for now, log the user to console
        console.log(user);
        // add models and user to context
        return { models, user };
    }
});

// apollo graphql middle
server.applyMiddleware({ app, path: '/api'});

app.get('/', (req, res) => res.send('Hello World'));

const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;

db.connect(DB_HOST);
app.listen(4000,  () => console.log(`GraphQL server running at http://localhost:${port}${server.graphqlPath}`));