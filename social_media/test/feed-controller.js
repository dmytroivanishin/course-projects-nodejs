const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");


const User = require("../models/user");
const Post = require("../models/post");
const FeedController = require("../controllers/feed");

describe("Feed Controller", () => {

    before(function(done) {
        mongoose
            .connect("")
            .then(() => {
                const user = new User({
                    email: "test@test.com",
                    password: "tester",
                    name: "Test",
                    posts: [],
                    _id: "5c0f66b979af55031b34728a"
                });

                return user.save();
            })
            .then(() => {
                done();
            })
    });
    // beforeEach(function() {});
    // afterEach(function() {});

    it("should add a created post to the posts of the creator", (done) => {
        const req = {
            body: {
                title: "Test Post",
                content: "A Test Post"
            },
            file: {
                path: "abc"
            },
            userId: "5c0f66b979af55031b34728a"
        };

        const res = { 
            status: function() {
                return this;
            },
            json: function() {}
        };

        FeedController
            .createPost(req, res, () => {})
            .then((savedUser) => {
                expect(savedUser).to.have.property("posts");
                expect(savedUser.posts).to.have.length(1);
                done();
            });
    });

    after(function(done) {
        User
            .deleteMany({})
            .then(() => {
                return mongoose.disconnect()
            })
            .then(() => {
                done();
            });
    });

});