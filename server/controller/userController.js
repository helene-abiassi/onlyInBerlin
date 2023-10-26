import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import { experienceModel } from "../models/experienceModel.js";
import { hashPassword, verifyPassword } from "../utilities/passwordServices.js";
import { generateToken } from "../utilities/tokenServices.js";

const getAllUsers = async (req, res) => {
  const allUsers = await userModel.find().populate([
    {
      path: "bookmarks",
      select: ["title", "publication_date", "photo"],
    },
    {
      path: "submissions",
      select: ["title", "publication_date", "photo"],
    },
  ]);

  console.log("allUsers :>> ", allUsers);

  res.json({
    number: allUsers.length,
    data: allUsers,
  });
};

const getUserById = async (req, res) => {
  const id = req.params._id;

  try {
    const userByID = await userModel.find({
      _id: id,
    });
    console.log("userByID :>> ", userByID);

    if (userByID.length > 0) {
      res.status(200).json({
        number: userByID.length,
        data: userByID,
      });
    } else {
      res.status(200).json({
        number: userByID.length,
        errorMessage: "OH NO! No such user with this id exists",
      });
    }
  } catch (error) {
    console.log("expType error :>> ", error);
    res.status(500).json({
      errorMessage: "something went wrong in the request",
      error,
    });
  }
};

const uploadImage = async (req, res) => {
  console.log(req.file);

  //Upload the file to cloudinary /if/ there is a file in req
  if (req.file) {
    try {
      // Upload the image
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "voyageApp/userphotos",
      });
      console.log("uploadedImage", uploadedImage);
      res.status(200).json({
        message: "Image uploaded successfully",
        userImage: uploadedImage.secure_url,
      });
      // Save the photo in the userphoto collection
    } catch (error) {
      console.error("error", error);
    }
  } else {
    res.status(5000).json({
      error: "File type not supported",
    });
  }
};

const signUp = async (req, res) => {
  // receive all the new user information in the body of the req coming from client
  // it will process that info and store it in db
  console.log("req.body :>> ", req.body);

  // Hash user password

  try {
    const hashedPassword = await hashPassword(req.body.password);

    if (hashedPassword) {
      // check if user already exists
      const existingUser = await userModel.findOne({ email: req.body.email });

      if (existingUser) {
        res.status(200).json({
          message: "email already exists in the db",
        });
      } else {
        // if no existing user, we save the new user

        try {
          const newUser = new userModel({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            user_image: req.body.user_image,
          });

          console.log("newUser :>> ", newUser);

          const savedUser = await newUser.save();
          res.status(201).json({
            message: "New user registered",
            user: {
              userName: savedUser.username,
              email: savedUser.email,
              userImage: savedUser.user_image,
            },
          });
        } catch (error) {
          console.log("error saving user :>> ", error);
          res.status(500).json({
            message: "something went wrong when registering your user",
          });
        }
      }
    }
  } catch (error) {
    console.log("error :>> ", error);
    res.status(500).json({
      message: "Oh no, it went wrong!",
    });
  }
};

const logIn = async (req, res) => {
  console.log("req.body :>> ", req.body);

  try {
    const existingUser = await userModel.findOne({ email: req.body.email });
    if (!existingUser) {
      res.status(404).json({
        msg: "no user found with this email",
      });
    } else {
      const checkPassword = await verifyPassword(
        req.body.password,
        existingUser.password
      );

      if (!checkPassword) {
        res.status(404).json({
          message: "Wrong password, try again",
        });
      }
      if (checkPassword) {
        const token = generateToken(existingUser._id);
        if (token) {
          res.status(200).json({
            message: "login success",
            user: {
              username: existingUser.username,
              email: existingUser.email,
              user_image: existingUser.user_image,
            },
            token,
          });
        } else {
          console.log("error generating token");
          res.status(400).json({
            message: "something went wrong with your request",
          });
        }

        // res.status(200).json({
        //   message: "you are logged  in",
        // });
      }
    }
  } catch (error) {
    res.status(500).json({
      message: "I don't have a clue",
    });
  }
};

const getProfile = async (req, res) => {
  console.log("req :>> ", req);

  if (req.user) {
    res.status(200).json({
      userProfile: {
        username: req.user.username,
        email: req.user.email,
        user_image: req.user.user_image,
      },
    });
  }
  if (!req.user) {
    res.status(200).json({
      message: "You need to log in to access this page",
    });
  }
};

export { uploadImage, signUp, getAllUsers, getUserById, logIn, getProfile };
