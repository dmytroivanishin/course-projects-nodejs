const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

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
    next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const { status = 500, message, data } = error;
    res.status(status).json({
        message,
        data
    })
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        const server = app.listen(8080, "127.0.0.1");
        const io = require("./socket").init(server);
        io.on("connection", socket => {

            console.log("Client connected.");
        });
    })
    .catch(err => {
        console.log(err);
    });

