import { type FormEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import type { Message } from "./types";
import Icon from "./Icon";
import { apiSubmission } from "./api";

const maxQuestionLength = 2000;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const remainingCharacters = maxQuestionLength - question.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = question.trim();
    if (!query || query.length > maxQuestionLength || isSending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setIsSending(true);

    try {
      const result = await apiSubmission(query);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: result },
      ]);
    } catch (sendError) {
      setMessages((current) =>
        current.filter((message) => message.id !== userMessage.id),
      );
      setQuestion(query);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Could not connect to the server.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function askSuggestion(prompt: string) {
    setQuestion(prompt);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Frame home">
          <span className="brand-mark">
            <Icon name="play" size={17} />
          </span>
          <span>
            frame<span className="brand-period">.</span>
          </span>
        </a>
        <div className="topbar-note">
          <span className="status-dot" /> Your video, in conversation
        </div>
        <a
          className="topbar-link"
          href="https://www.youtube.com"
          target="_blank"
          rel="noreferrer"
        >
          YouTube <Icon name="arrow" size={15} />
        </a>
      </header>

      <main className="workspace">
        <section className="chat-panel" aria-label="Video chat">
          <div className="chat-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> VIDEO CONVERSATION
              </div>
              <h1>
                Ask the video<span className="heading-period">.</span>
              </h1>
              <p className="heading-subtitle">
                Get thoughtful answers, grounded in the transcript.
              </p>
            </div>
            <div className="privacy-note">
              <Icon name="spark" size={16} /> Transcript-powered
            </div>
          </div>

          <div className="conversation">
            {messages.length === 0 ? (
              <div className="welcome">
                <div className="welcome-icon">
                  <Icon name="message" size={21} />
                </div>
                <p className="welcome-kicker">A LITTLE MORE CONTEXT</p>
                <h2>
                  Make every minute
                  <br />
                  of video count.
                </h2>
                <p className="welcome-copy">
                  Ask for a summary, dig into an idea, or find the moment you’re
                  looking for.
                </p>
                <div className="suggestions" aria-label="Suggested questions">
                  {[
                    "Give me the short version",
                    "What are the key takeaways?",
                    "What limitations are mentioned?",
                  ].map((prompt) => (
                    <button
                      className="suggestion"
                      key={prompt}
                      onClick={() => askSuggestion(prompt)}
                    >
                      <span>{prompt}</span>
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="message-list" aria-live="polite">
                {messages.map((message) => (
                  <article
                    className={`message message-${message.role}`}
                    key={message.id}
                  >
                    <div className="message-avatar">
                      {message.role === "assistant" ? (
                        <Icon name="spark" size={16} />
                      ) : (
                        "Y"
                      )}
                    </div>
                    <div className="message-body">
                      <div className="message-author">
                        {message.role === "assistant" ? "Frame" : "You"}
                      </div>
                      <p>{message.content}</p>
                    </div>
                  </article>
                ))}
                {isSending && (
                  <div
                    className="message message-assistant"
                    role="status"
                    aria-label="Frame is thinking"
                  >
                    <div className="message-avatar">
                      <Icon name="spark" size={16} />
                    </div>
                    <div className="message-body">
                      <div className="message-author">Frame</div>
                      <div className="typing-indicator">
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <div className="composer-wrap">
            <form className="composer" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="question">
                Ask a question about this video
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask anything about this video..."
                maxLength={maxQuestionLength}
                rows={2}
                disabled={isSending}
              />
              <div className="composer-footer">
                <span className="composer-hint">
                  {" "}
                  <kbd>↵</kbd> to send <span className="hint-divider">·</span>{" "}
                  <kbd>shift + ↵</kbd> for a new line
                </span>
                <div className="composer-actions">
                  <span
                    className={`character-count ${remainingCharacters < 100 ? "near-limit" : ""}`}
                  >
                    {remainingCharacters}
                  </span>
                  <button
                    className="send-button"
                    type="submit"
                    aria-label="Send question"
                    disabled={
                      !question.trim() ||
                      question.trim().length > maxQuestionLength ||
                      isSending
                    }
                  >
                    <Icon name="send" size={17} />
                  </button>
                </div>
              </div>
            </form>
            <p className="disclaimer">
              Answers are generated from the video transcript and may not be
              perfect.
            </p>
          </div>
        </section>
      </main>
      <footer className="page-footer">
        <span>
          FRAME <span className="footer-dot">·</span> THINK DEEPER, WATCH LESS
        </span>
        <span>MADE FOR THE CURIOUS</span>
      </footer>
    </div>
  );
}

export default App;
