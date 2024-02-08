import React, {
  Fragment,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RobotIcon } from "../../assets";

import ReactDom from 'react-dom';
import ReactMarkdown from "react-markdown";
import { insertNew } from "../../redux/messages";
import "./style.scss";



const Chat = forwardRef(({ error, status }, ref) => {
  const dispatch = useDispatch();

  const contentRef = useRef(null);

  const containerRef = useRef(); // for scroll down

  const { user, messages } = useSelector((state) => state);
  const { latest, content, all } = messages;

  const renderMarkdown = (content) => {
    return ReactDom.renderToString(
      <ReactMarkdown>{content} </ReactMarkdown>
    );
  };

  const loadResponse = async (
    stateAction,
    response = content,
    imageUrl, // Pass the imageUrl as a parameter
    chatsId = latest?.id
  ) => {
    clearInterval(window.interval);

    stateAction({ type: "resume", status: true });

    const waitForContentRef = async () => {
      if (contentRef?.current) {
        contentRef.current.classList.add("blink");

        // merge respose and imageURL if present and display

        let renderedContent = renderMarkdown(response);

        // Render the content
        let contentHTML = `<span style="display: inline-block"><p>${response}</p></span><br>`;
        if (imageUrl) {
          contentHTML += `<img src="${imageUrl}" alt="Image" style="display: inline-block; width="70%" height="70%";">`;
        }

        // Set the HTML content
        contentRef.current.innerHTML = contentHTML;


        // Insert the content into the Redux store
        dispatch(insertNew({ chatsId, content: response, resume: true }));
        stopResponse(stateAction);
      } else {
        // Wait and try again after a short delay
        setTimeout(waitForContentRef, 100); // Adjust the delay as needed
      }
    };

    waitForContentRef();
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

  useEffect(() => {
    containerRef.current.scrollIntoView();
  }, [latest, content, all]);

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
                </div>
                <div className="txt">
                  <span>
                    <ReactMarkdown>{obj?.content}</ReactMarkdown>
                    {obj.imageUrl && <img src={obj.imageUrl} alt="Image" width="70%" height="70%" />}

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

              {error && <span>!</span>}
            </div>
            <div className="txt">
              {error ? (
                <div className="error">Something went wrong.</div>
              ) : !status?.resume ? (
                <span ref={contentRef} className="blink" />
              ) : (
                <span className="loading-text">Loading....</span>
              )}
            </div>
          </div>
        </Fragment>
      )}
      <div ref={containerRef} />
    </div>
  );
});
export default Chat;
