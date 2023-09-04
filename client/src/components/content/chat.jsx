import React, {
  forwardRef,
  Fragment,
  useImperativeHandle,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { GptIcon } from "../../assets";
import { RobotIcon } from "../../assets";

import { insertNew } from "../../redux/messages";
import "./style.scss";
import ReactMarkdown from "react-markdown";
import ReactDOMServer from "react-dom/server";
const Chat = forwardRef(({ error }, ref) => {
  const dispatch = useDispatch();

  const contentRef = useRef();


  const { user, messages } = useSelector((state) => state);
  const { latest, content, all } = messages;

  const renderMarkdown = (content) => {
    return ReactDOMServer.renderToString(
      <ReactMarkdown>{content}</ReactMarkdown>
    );
  };

  const loadResponse = (
    stateAction,
    response = content,
    chatsId = latest?.id
  ) => {
    clearInterval(window.interval);

    stateAction({ type: "resume", status: true });

    contentRef?.current?.classList?.add("blink");

    let renderedContent = renderMarkdown(response); // Render the entire content at once

    contentRef.current.innerHTML = `<span style="display: inline-block">${renderedContent}</span>`;
    dispatch(insertNew({ chatsId, content: response, resume: true }));

    stopResponse(stateAction);
  };

  const stopResponse = (stateAction) => {
    if (contentRef?.current) {
      contentRef.current.classList.remove("blink");
    }
    stateAction({ type: "resume", status: false });
    clearInterval(window.interval);
  };

  useImperativeHandle(ref, () => ({
    stopResponse,
    loadResponse,
    clearResponse: () => {
      if (contentRef?.current) {
        contentRef.current.innerHTML = "";
        contentRef?.current?.classList.add("blink");
      }
    },
  }));


  return (
    <div className="Chat">
      {all
        ?.filter((obj) => {
          return !obj.id ? true : obj?.id !== latest?.id;
        })
        ?.map((obj, key) => {
          return (
            <Fragment key={key}>
              <div className="qs">
                <div className="acc">{user?.fName?.charAt(0)}</div>
                <div className="txt1">
                  <ReactMarkdown>{obj?.prompt}</ReactMarkdown>
                </div>
              </div>

              <div className="res">
                <div className="icon">
                  <RobotIcon />
                  {/*<GptIcon />*/}
                </div>
                <div className="txt">
                  <span>
                    <ReactMarkdown>{obj?.content}</ReactMarkdown>
                  </span>
                </div>
              </div>
            </Fragment>
          );
        })}

      {latest?.prompt?.length > 0 && (
        <Fragment>
          <div className="qs">
            <div className="acc">{user?.fName?.charAt(0)}</div>
            <div className="txt">
              <ReactMarkdown>{latest?.prompt}</ReactMarkdown>
            </div>
          </div>

          <div className="res">
            <div className="icon">
              <RobotIcon />

              {/*<GptIcon />*/}

              {error && <span>!</span>}
            </div>
            <div className="txt">
              {error ? (
                <div className="error">Something went wrong.</div>
              ) : (
                <span ref={contentRef} className="blink" />
              )}
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
});
export default Chat;
