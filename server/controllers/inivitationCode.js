import chat from "../helpers/chat.js";

export const userDetails = async (req, res) => {
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
};

export const createCodes= async (req, res) => {
    const { n, partner_name } = req.body; 
  
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
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

export const getCodes=async (req, res) => {
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
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

export const updateCode= async (req, res) => {
    const userId = req.body.userId;
    const invitationCode = req.body.code;
  
    try {
      const update = await chat.updateInvitationCode(userId, invitationCode);
  
      res.status(200).json({ update });
    } catch (err) {
    
      res.status(500).json({
        status: 500,
        message: err || "Internal Server Error",
      });
    }
  }

export const validateCodes= async (req, res) => {
    const { code } = req.body;
  
    try {
      if (!code) {
        return res.status(400).json({ error: "Invalid or missing code." });
      }
  
      const result = await chat.checkCodeAvailability(code);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

export const deleteCode=async (req, res) => {
    const { code, userId } = req.body;
  
    try {
      if (!code) {
        return res.status(400).json({ error: "Invalid or missing code." });
      }
  
      const result = await chat.deleteCode(userId, code);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }