import { Router } from "express";
import { CheckUser } from "../middleware/user.js";
import { addChat, deleteAllChat, deleteChat, getChat, getHistory, newChat, } from "../controllers/chat.js";
import { createCodes, deleteCode, getCodes, updateCode, userDetails, validateCodes } from "../controllers/inivitationCode.js";
import { UpdateModelType, modelType } from "../controllers/model.js";



let router = Router();

router.get("/", (req, res) => {
  res.send("Welcome to chatGPT api v1");
});

// Model type
router.get("/modelType",CheckUser,modelType)
router.put("/modelType", CheckUser,UpdateModelType);


// Chat
router.post("/", CheckUser,newChat);
router.put("/", CheckUser,addChat );
router.get("/saved", CheckUser,getChat);
router.get("/history", CheckUser,getHistory);
router.delete("/all", CheckUser,deleteAllChat );
router.delete("/chats/:chatId", CheckUser,deleteChat);

// UserDetails
router.get("/userDetails", CheckUser,userDetails );

// Invitation Codes
router.post("/generateInvitationCodes",createCodes);
router.put("/update-invitation-code", CheckUser,updateCode);
router.post("/fetchInvitationCodesByPartnerName",getCodes );
router.post("/checkCodeAvailability",validateCodes);
router.post("/deleteCode",deleteCode );

export default router;
