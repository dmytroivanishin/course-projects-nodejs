const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    const { email, name, password } = req.body;

    if(!errors.isEmpty()){
        const error = new Error("Validation failed.");
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    try{
        const hashedPw = await bcrypt.hash(password, 12)
        const user = new User({
            email,
            password: hashedPw,
            name
        });
        const result = await user.save();

        res.status(201).json({
            message: "User created successfully!",
            userId: result._id
        });
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const { email, password, name } = req.body;

    try{
        const user = await User.findOne({ email });
        if(!user){
            const error = new Error("A user with this email could not be found.");
            error.statusCode = 401;
            throw error;
        }

        const isEqual = await bcrypt.compare(password, user.password);

        if(!isEqual){
            const error = new Error("Wrong password.");
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString()
            },
            "somesupersecretsecret",
            { expiresIn: "1h" }
        );
        
        res.status(200).json({
            token,
            userId: user._id.toString()
        });
        return;
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
        return err;
    }
    
};

exports.getStatus = async (req, res, next) => {
    try{
        const user = await User.findById(req.userId);

        if(!user){
            const error = new Error("Could not find user.");
            error.statusCode = 422;
            throw error;
        }

        res.status(200).json({
            message: "Status fetched successfully.",
            status: user.status
        });
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    const { status } = req.body;

    try{
        const user = await User.findById(req.userId)
        if(!user){
            const error = new Error("Could not find user.");
            error.statusCode = 404;
            throw error;
        }

        user.status = status;
        const result = await user.save();
        
        res.status(201).json({
            message: "Status updated successfully.",
            status: result.status
        });
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };
};