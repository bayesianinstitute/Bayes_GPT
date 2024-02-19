import user from "../helpers/user.js";
import jwt from "jsonwebtoken";

export const CheckUser = async (req, res, next) => {
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

export const CheckLogged = async (req, res, next) => {
  const token = req.cookies.userToken

  jwt.verify(token, process.env.JWT_PRIVATE_KEY, async (err, decoded) => {
      if (decoded) {
          let userData = null

          try {
              userData = await user.checkUserFound(decoded)
          } catch (err) {
              if (err?.notExists) {
                  res.clearCookie('userToken')
                  next()
              } else {
                  res.status(500).json({
                      status: 500,
                      message: err
                  })
              }
          } finally {
              if (userData) {
                  delete userData.pass
                  res.status(208).json({
                      status: 208,
                      message: 'Already Logged',
                      data: userData
                  })
              }
          }

      } else {
          next()
      }
  })
};
