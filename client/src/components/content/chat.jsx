import React, {
  Fragment,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RobotIcon } from "../../assets";

import ReactMarkdown from "react-markdown";
import { insertNew } from "../../redux/messages";
import "./style.scss";

import { LazyLoadImage } from "react-lazy-load-image-component";

const Chat = forwardRef(({ error, status }, ref) => {
  const dispatch = useDispatch();

  const [isImage, setIsImage] = useState(false);

  const contentRef = useRef(null);

  const containerRef = useRef(); // for scroll down

  const { user, messages } = useSelector((state) => state);
  const { latest, content, all } = messages;

  const loadResponse = async (
    stateAction,
    response = content,
    imageUrl,
    chatsId = latest?.id
  ) => {
    clearInterval(window.interval);
    stateAction({ type: "resume", status: true });
    let contentHTML = `<span style="display: inline-block"><p>${response}</p></span><br>`;
    if (imageUrl) {
      setIsImage(true);
      contentHTML += `<img src="${imageUrl}" alt="Loading Image" >`;

      setTimeout(() => {
        // Set the HTML content
        contentRef.current.innerHTML = contentHTML;
      }, 9000);
    } else {
      setIsImage(false);
    }
    // Insert the content into the Redux store
    dispatch(insertNew({ chatsId, imageUrl, content: response, resume: true }));

    // Stop response immediately
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
                    {obj.imageUrl && (
                      <LazyLoadImage
                        src={obj.imageUrl}
                        alt="Image"
                        effect="blur"
                        style={{
                          maxWidth: "100%", // Ensure the image fills the available width while maintaining aspect ratio
                          height: "50vh", // Set a fixed height for the image
                          display: "block",
                          margin: "0 auto",
                          objectFit: "contain",
                        }}
                      />
                    )}
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
                isImage ? (
                  <div ref={contentRef} className="blink">
                    <ReactMarkdown>{latest?.content}</ReactMarkdown>
                    {latest?.imageUrl && (
                      <LazyLoadImage
                        src={latest?.imageUrl}
                        alt="Image"
                        width="50%"
                        height="50%"
                      />
                    )}
                  </div>
                ) : (
                  <ReactMarkdown>{latest?.content}</ReactMarkdown> // Render content here
                )
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
