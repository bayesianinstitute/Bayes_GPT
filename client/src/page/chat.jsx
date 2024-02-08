import React, { useEffect, useReducer, useRef, useState } from "react";
import { Reload, Rocket, Stop } from "../assets";
import { Chat, New } from "../components";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { setLoading } from "../redux/loading";
import { useDispatch, useSelector } from "react-redux";
import { addList, emptyAllRes, insertNew, livePrompt } from "../redux/messages";
import { emptyUser } from "../redux/user";
import instance from "../config/instance";
import ReactMarkdown from "react-markdown";
import "./style.scss";

const reducer = (state, { type, status }) => {
  switch (type) {
    case "chat":
      return {
        chat: status,
        loading: status,
        resume: status,
        actionBtns: false,
      };
    case "error":
      return {
        chat: true,
        error: status,
        resume: state.resume,
        loading: state.loading,
        actionBtns: state.actionBtns,
      };
    case "resume":
      return {
        chat: true,
        resume: status,
        loading: status,
        actionBtns: true,
      };
    default:
      return state;
  }
};

const Main = () => {
  let location = useLocation();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const chatRef = useRef();


  const { id = null } = useParams();

  const { user } = useSelector((state) => state);
  const isUserExpired = user.expireAt && new Date(user.expireAt) < new Date();

  const [status, stateAction] = useReducer(reducer, {
    chat: false,
    error: false,
    actionBtns: false,
  });

  useEffect(() => {
    if (user) {
      dispatch(emptyAllRes());
      setTimeout(() => {
        if (id) {
          const getSaved = async () => {
            let res = null;
            try {
              res = await instance.get("/api/chat/saved", {
                params: {
                  chatId: id,
                },
              });
            } catch (err) {
              console.log(err);
              if (err?.response?.data?.status === 404) {
                navigate("/404");
              } else {
                alert(err);
                dispatch(setLoading(false));
              }
            } finally {
              if (res?.data) {
                dispatch(addList({ _id: id, items: res?.data?.data }));
                stateAction({ type: "resume", status: false });
                dispatch(setLoading(false));
              }
            }
          };

          getSaved();
        } else {
          stateAction({ type: "chat", status: false });
          dispatch(setLoading(false));
        }
      }, 1000);
    }
  }, [location]);

  return (
    <div className="main">
      <div className="contentArea">
        {status.chat ? (
          <Chat ref={chatRef} status={status} error={status.error} />
        ) : (
          <New />
        )}
      </div>
      <InputArea status={status} chatRef={chatRef} stateAction={stateAction} />
      {isUserExpired && (
        <div className="expiredAlert">
          <p>Your invitation code has expired. Please update it to continue.Goto Setting and then Update Invitation Code</p>
        </div>
      )}
    </div>
  );
};

//Input Area
const InputArea = ({ status, chatRef, stateAction }) => {
  
  let textAreaRef = useRef();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { user } = useSelector((state) => state);
  const isUserExpired = user.expireAt && new Date(user.expireAt) < new Date();


  const { prompt, content, _id } = useSelector((state) => state.messages);


  const [textSubmitted,setTextSubmitted]=useState(false);

  const FormHandle = async () => {
    if (prompt?.length > 0) {
      stateAction({ type: "chat", status: true });

      let chatsId = Date.now();

      dispatch(insertNew({ id: chatsId, content: "", prompt }));
      chatRef?.current?.clearResponse();

      dispatch(livePrompt(""));
 
      setTextSubmitted(true);

      if (textAreaRef.current) {
        textAreaRef.current.style.height = "auto";
        textAreaRef.current.style.height = "31px"; // Default height after submitting
      }

      let res = null;

      try {
        if (_id) {
          res = await instance.put("/api/chat", {
            chatId: _id,
            prompt,
          });
        } else {
          res = await instance.post("/api/chat", {
            prompt,
          });
        }
      } catch (err) {
        console.log(err);
        if (err?.response?.data?.status === 405) {
          dispatch(emptyUser());
          dispatch(emptyAllRes());
          navigate("/login");
        } else {
          stateAction({ type: "error", status: true });
        }
      } finally {
        if (res?.data) {
          const { _id, content,imageUrl } = res?.data?.data;
          {console.log("response",_id, content,imageUrl)};
          dispatch(insertNew({ _id, fullContent: content,imageUrl, chatsId }));

          chatRef?.current?.loadResponse(stateAction, content,imageUrl, chatsId);

          // Stop animation
          stateAction({ type: "resume", status: false });

          stateAction({ type: "error", status: false });
        }
      }
    }
  };

    useEffect(() => {
    const adjustTextAreaHeight = () => {
      textAreaRef.current.style.height = "auto"; // Reset height to auto
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
      
    };

    textAreaRef.current.addEventListener("input", adjustTextAreaHeight);


    if (textAreaRef.current && prompt.length === 0 && textSubmitted) {
      textAreaRef.current.style.height="31 px"
    }
    
  }, [prompt,textSubmitted]);


  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      FormHandle();
    }
  };

  return (
    <div className="inputArea">
      {!status.error ? (
        <>
          <div className="chatActionsLg">
            {status.chat && content?.length > 0 && status.actionBtns && (
              <>
                {!status?.resume ? (
                  <button
                    onClick={() => {
                      chatRef.current.loadResponse(stateAction);
                    }}
                  >
                    <Reload /> Regenerate response
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      chatRef.current.stopResponse(stateAction);
                    }}
                  >
                    <Stop /> Stop generating
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flexBody">
            <div className="box">

            <textarea
                    placeholder="Press Ctrl+Enter To Submit..."
                    ref={textAreaRef}
                    value={prompt}
                    onChange={(e) => {
                      dispatch(livePrompt(e.target.value));
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isUserExpired} // Add this line to disable textarea when user is expired
                  />

              {!status?.loading ? (
                <button onClick={FormHandle}>{<Rocket />}</button>
              ) : (
                <div className="loading">
                  <div className="dot" />
                  <div className="dot-2 dot" />
                  <div className="dot-3 dot" />
                </div>
              )}
            </div>

            {status.chat && content?.length > 0 && status.actionBtns && (
              <>
                {!status?.resume ? (
                  <div className="chatActionsMd">
                    <button
                      onClick={() => {
                        chatRef.current.loadResponse(stateAction);
                      }}
                    >
                      <Reload />
                    </button>
                  </div>
                ) : (
                  <div className="chatActionsMd">
                    <button
                      onClick={() => {
                        chatRef.current.stopResponse(stateAction);
                      }}
                    >
                      <Stop />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="error">
          <p>There was an error generating a response</p>
          <button onClick={FormHandle}>
            <Reload />
            Regenerate response
          </button>
        </div>
      )}

      <div className="text">
        Free Bayes Preview Research. Our goal is to make AI systems more natural and
        safe to interact with. Your feedback will help us improve.
      </div>
    </div>
  );
};

export default Main;
