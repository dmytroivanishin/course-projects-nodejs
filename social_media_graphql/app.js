const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const graphqlHttp = require('express-graphql');

const auth = require("./middleware/auth");

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const { clearImage } = require("./util/file");

const app = express();
const MONGODB_URI = "";

const fileStorage = multer.diskStorage({
    destination: (req, file, cd) => {
        cd(null, "images");
    },
    filename: (req, file, cd) => {
        cd(null, Date.now().toString() + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cd) => {
    const { mimetype } = file

    if(mimetype === "image/png" || mimetype === "image/jpg" || mimetype === "image/jpeg"){
        cd(null, true);
    }
    else{
        cd(null, false);
    }
}

app.use(bodyParser.json());
app.use(
    multer({ storage: fileStorage, fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if(req.method === "OPTIONS"){
        return res.sendStatus(200);
    }

    next();
});

app.use(auth);

app.put("/post-image", (req, res, next) => {

    if(!req.isAuth){
        throw new Error("Not authenticated.")
    }
    if(!req.file){
        return res.status(200).json({ message: "No file provided!" });
    }

    if(req.body.oldPath){
        clearImage(req.body.oldPath)
    }

    const newImageUrl =  req.file.path.replace('\\', '/');

    return res
        .status(201)
        .json({ message: 'File stored.', filePath: newImageUrl });

});

app.use("/graphql", graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err){

        //console.log(err.originalError);

        const data = err.data;
        const code = err.code || 500;
        const { message = "An error occured." } = err;

        return {
            message,
            status: code,
            data
        };
    }
}))

app.use((error, req, res, next) => {
    //console.log(error);
    const { status = 500, message, data } = error;
    res.status(status).json({
        message,
        data
    })
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        app.listen(8080, "127.0.0.1");
    })
    .catch(err => {
        console.log(err);
    });

