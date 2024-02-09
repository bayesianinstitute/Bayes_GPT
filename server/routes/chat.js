import { Router } from "express";
import dotnet from "dotenv";
import OpenAI from "openai";
import user from "../helpers/user.js";
import jwt from "jsonwebtoken";
import chat from "../helpers/chat.js";
import { ObjectId } from "mongodb";

import { sendErrorEmail } from "../mail/send.js";
import multer from "multer";
import https from "https";
import fs from "fs";


dotnet.config();

let router = Router();
let chatId;
let sendingError;
// Multer storage configuration
// Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const folderPath = 'image-generation'; // Folder path
//     if (!fs.existsSync(folderPath)) {
//       fs.mkdirSync(folderPath);
//     }
//     cb(null, folderPath); // Destination folder
//   },
//   filename: function (req, file, cb) {
//     const timestamp = Date.now(); // Get the current timestamp
//     const filename = `${timestamp}-${file.originalname}`; // Combine timestamp and original filename
//     cb(null, filename); // Set the filename
//   },
// });

// const upload = multer({ storage: storage });
const openai = new OpenAI({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});

const CheckUser = async (req, res, next) => {
  jwt.verify(
    req.cookies?.userToken,
    process.env.JWT_PRIVATE_KEY,
    async (err, decoded) => {
      if (decoded) {
        let userData = null;

        try {
          userData = await user.checkUserFound(decoded);
        } catch (err) {
          if (err?.notExists) {
            res.clearCookie("userToken").status(405).json({
              status: 405,
              message: err?.text,
            });
          } else {
            res.status(500).json({
              status: 500,
              message: err,
            });
          }
        } finally {
          if (userData) {
            req.body.userId = userData._id;
            next();
          }
        }
      } else {
        res.status(405).json({
          status: 405,
          message: "Not Logged",
        });
      }
    }
  );
};

router.get("/", (req, res) => {
  res.send("Welcome to chatGPT api v1");
});

// Example API endpoint to get and update model type
router.get("/modelType", CheckUser, async (req, res) => {
  const userId = req.body.userId;
  try {
    // Call your getModelType function
    const modelType = await chat.getModelType(userId);

    res.status(200).json({
      status: 200,
      data: {
        modelType,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err,
    });
  }
});

router.put("/modelType", CheckUser, async (req, res) => {
  const userId = req.body.userId;
  const modelType = req.body.modelType;
  try {
    // Call your saveModelType function
    await chat.saveModelType(userId, modelType);

    res.status(200).json({
      status: 200,
      message: "Model type updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err,
    });
  }
});

router.post("/", CheckUser, async (req, res) => {
  const { prompt, userId } = req.body;

  chatId = new ObjectId().toHexString();

  let response = {};
  console.log("chatId in router in post :", chatId);

  let conversation = [
    {
      role: "assistant",
      content:
        " Your name is Bayes CHAT-AI.  Strictly follow the users instructions. Please Understand Query try to reply to it in Efficient Way.  You were created by Bayes Solution  .You Should able to translate in different Language if user ask.Give content in Mardown Format Only",
    },
  ];
  console.log("prompt in post :", prompt);

  try {
    const modelType = await chat.getModelType(userId);
    // const modelType = "dall-e-3";
    console.log("modelType in post :", modelType);

    if (modelType === "dall-e-3") {
      const response = await openai.images.generate({
        model: modelType,
        prompt: prompt,
      });
      if (response?.data) {
        let revisedPrompt = response.data[0].revised_prompt;
        let url = response.data[0].url;
        // let assistantReply = response.choices[0]?.message?.content;
        console.log(revisedPrompt);
        console.log(url);

        
        const timestamp = Date.now(); // Get the current timestamp
        const imagePath = `image-generation/${timestamp}.jpg`; // Construct the image path
        
       
        const file = fs.createWriteStream(imagePath);
        const request = https.get(url, function(response) {
          response.pipe(file);
          file.on('finish', function() {
            file.close();
          });
        });

        response.openai = revisedPrompt;
        response.url = `${process.env.SITE_URL}:${process.env.PORT}/${imagePath}`;

        response.db = await chat.newResponse(prompt, response, userId, chatId);

        

        
        if (response.db && response.openai && response.url) {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: {
              _id: response.db["chatId"],
              content: response.openai,
              imageUrl: response.url,
            },
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Incomplete response",
          });
        }
      }
    } else {
      conversation.push({ role: "user", content: prompt });

      response = await openai.chat.completions.create({
        model: modelType,
        messages: conversation,
        temperature: 0.6,
      });
      // console.log("response in post :", response);

      if (response.choices[0]?.message?.content) {
        let assistantReply = response.choices[0]?.message?.content;

        response.openai = assistantReply;
        response.db = await chat.newResponse(prompt, response, userId, chatId);

        conversation.push({ role: "assistant", content: assistantReply });

        await chat.saveConversation(chatId, conversation); // Save conversation to the database



        if (response.db && response.openai) {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: {
              _id: response.db["chatId"],
              content: response.openai
            },
          });
        } else {
          // sendingError = "Error in response chat" + err;

          // sendErrorEmail(sendingError);
          res.status(500).json({
            status: 500,
            message: "Incomplete response",
          });
        }
      }
    }
  } catch (err) {
    // sendingError = "Error in post" + err;

    // sendErrorEmail(sendingError);

    res.status(500).json({
      status: 500,
      message: err,
    });
    return;
  }

  // if (response.db && response.openai) {
  //   // conversationMemory[chatId] = conversation;

  //   res.status(200).json({
  //     status: 200,
  //     message: "Success",
  //     data: {
  //       _id: response.db["chatId"],
  //       content: response.openai,
  //     },
  //   });
  // } else {
  //   // sendingError = "Error in response chat" + err;

  //   // sendErrorEmail(sendingError);

  //   res.status(500).json({
  //     status: 500,
  //     message: "Incomplete response",
  //   });
  // }
});

router.put("/", CheckUser, async (req, res) => {
  const { prompt, userId, chatId } = req.body;
  let response = {};

  try {
    const modelType = await chat.getModelType(userId);
    // const modelType = "dall-e-3";
    console.log("modelType in put :", modelType);

    if (modelType === "dall-e-3") {
      const responseFromOpenAI = await openai.images.generate({
        model: modelType,
        prompt: prompt,
      });

      if (responseFromOpenAI?.data) {
        let revisedPrompt = responseFromOpenAI.data[0].revised_prompt;
        let url = responseFromOpenAI.data[0].url;
        console.log(revisedPrompt);
        console.log(url);

        const timestamp = Date.now(); // Get the current timestamp
        const imagePath = `image-generation/${timestamp}.jpg`; // Construct the image path
          // Create the directory and any necessary subdirectories recursively if they don't exist
       

        const file = fs.createWriteStream(imagePath);
        const request = https.get(url, function(response) {
          response.pipe(file);
          file.on('finish', function() {
            file.close();
          });
        });
 
        console.log("imagePath",imagePath)
        response.openai = revisedPrompt;
        response.url = `${process.env.SITE_URL}:${process.env.PORT}/${imagePath}`;


        response.db = await chat.updateChat(chatId, prompt, response, userId);

        if (response.db && response.openai && response.url) {
          res.status(200).json({
            status: 200,
            message: "Success",
            data: {
              content: response.openai,
              imageUrl: response.url,
            },
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Incomplete response",
          });
        }
      } else {
        res.status(500).json({
          status: 500,
          message: "Incomplete response from OpenAI",
        });
      }
    } else {
      let conversation = await chat.getConversation(chatId);

      conversation.push({ role: "user", content: prompt });

      response = await openai.chat.completions.create({
        model: modelType,
        messages: conversation,
        temperature: 0.6,
      });

      if (response.choices[0]?.message?.content) {
        let assistantReply = response.choices[0]?.message?.content;

        response.openai = assistantReply;
        response.db = await chat.updateChat(chatId, prompt, response, userId);

        conversation.push({ role: "assistant", content: assistantReply });

        await chat.saveConversation(chatId, conversation); // Save updated conversation to the database
      }

      if (response.db && response.openai) {
        res.status(200).json({
          status: 200,
          message: "Success",
          data: {
            content: response.openai,
          },
        });
      } else {
        res.status(500).json({
          status: 500,
          message: "Incomplete response",
        });
      }
    }
  } catch (err) {
    console.log("err :" + err);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
});

router.get("/saved", CheckUser, async (req, res) => {
  const { userId } = req.body;
  const { chatId = null } = req.query;

  let response = null;

  try {
    response = await chat.getChat(userId, chatId);
  } catch (err) {
    if (err?.status === 404) {
      res.status(404).json({
        status: 404,
        message: "Not found",
      });
    } else {
      sendingError = "Error in getChat : ${err}";
      // sendErrorEmail(sendingError);
      res.status(500).json({
        status: 500,
        message: err,
      });
    }
  } finally {
    if (response) {
      res.status(200).json({
        status: 200,
        message: "Success",
        data: response,
      });
    }
  }
});

router.get("/history", CheckUser, async (req, res) => {
  const { userId } = req.body;

  let response = null;

  try {
    response = await chat.getHistory(userId);
  } catch (err) {
    sendingError = "Error in getting history " + err;
    // sendErrorEmail(sendingError);
    res.status(500).json({
      status: 500,
      message: err,
    });
  } finally {
    if (response) {
      res.status(200).json({
        status: 200,
        message: "Success",
        data: response,
      });
    }
  }
});

router.delete("/all", CheckUser, async (req, res) => {
  const { userId } = req.body;

  let response = null;

  try {
    response = await chat.deleteAllChat(userId);
  } catch (err) {
    sendingError = "Error in deleting chat" + err;
    // sendErrorEmail(sendingError);

    res.status(500).json({
      status: 500,
      message: err,
    });
  } finally {
    if (response) {
      res.status(200).json({
        status: 200,
        message: "Success",
      });
    }
  }
});

router.get("/userDetails", CheckUser, async (req, res) => {
  const userId = req.body.userId;

  try {
    const user = await chat.getUserDetails(userId);

    if (!user) {
      res.status(404).json({
        status: false,
        message: "User not found",
      });
      return;
    }

    const currentDate = new Date();
    const isExpired = currentDate > new Date(user.expireAt);

    const userDetails = {
      status: !isExpired,
      fName: user.fName,
      lName: user.lName,
      expireAt: user.expireAt,
      inviteCode: user.inviteCode,
    };

    res.status(200).json(userDetails);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err,
    });
  }
});

router.post("/generateInvitationCodes", async (req, res) => {
  const { n, partner_name } = req.body; // Assuming 'n' is the number of codes to generate

  try {
    if (!n || isNaN(n) || n <= 0 || !partner_name) {
      return res
        .status(400)
        .json({ error: "Invalid or missing values for n or partner_name." });
    }

    const result = await chat.generateAndInsertInvitationCodes(
      parseInt(n),
      partner_name
    );
    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.put("/update-invitation-code", CheckUser, async (req, res) => {
  const userId = req.body.userId;
  const invitationCode = req.body.code;
  console.log(invitationCode);
  console.log("UserId ", userId);

  try {
    // Call your updateInvitationCode function
    const update = await chat.updateInvitationCode(userId, invitationCode);

    res.status(200).json({ update });
  } catch (err) {
    console.error("Error updating invitation code:", err); // Log the error
    res.status(500).json({
      status: 500,
      message: err || "Internal Server Error",
    });
  }
});

router.post("/fetchInvitationCodesByPartnerName", async (req, res) => {
  const { partner_name } = req.body;

  try {
    if (!partner_name) {
      return res
        .status(400)
        .json({ error: "Invalid or missing partner_name." });
    }

    const codes = await chat.fetchInvitationCodesByPartnerName(partner_name);
    res.status(200).json({ codes });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/checkCodeAvailability", async (req, res) => {
  const { code } = req.body;

  try {
    if (!code) {
      return res.status(400).json({ error: "Invalid or missing code." });
    }

    const result = await chat.checkCodeAvailability(code);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/deleteCode", async (req, res) => {
  const { code, userId } = req.body;

  try {
    if (!code) {
      return res.status(400).json({ error: "Invalid or missing code." });
    }

    const result = await chat.deleteCode(userId, code);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
export default router;
