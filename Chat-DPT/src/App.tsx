import './App.css'
import { MarkdownAssistantBubble } from './components/AssistantMarkdown'
import { useChatBot } from './hooks/useChatBot'

export default function App() {
  const {
    messages,
    input,
    setInput,
    isThinking,
    send,
    listRef,
    textareaRef,
    onComposerKeyDown,
  } = useChatBot()

  return (
    <div className="chat-app">
      <header className="chat-header">
        <span className="chat-header-title">MIVI AI</span>
      </header>

      <main ref={listRef} className="chat-scroll" aria-label="Conversation">
        {messages.length === 0 && !isThinking ? (
          <div className="chat-empty">
            <h1 className="chat-empty-title">What can I help with?</h1>
            <p className="chat-empty-hint">
              Type a message below. User messages appear on the right; assistant
              replies on the left.
            </p>
          </div>
        ) : (
          <div className="chat-thread">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-turn chat-turn--${m.role}`}
                data-role={m.role}
              >
                {m.role === 'assistant' && (
                  <div className="chat-avatar" aria-hidden>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26A6.99 6.99 0 0 1 5 9a7 7 0 0 1 7-7zm0 2a5 5 0 0 0-5 5c0 1.88 1.03 3.51 2.55 4.37l.45.26V17h4v-3.37l.45-.26A4.98 4.98 0 0 0 17 9a5 5 0 0 0-5-5zm-1 17h2v1h-2v-1z" />
                    </svg>
                  </div>
                )}
                <div className="chat-bubble-wrap">
                  {m.role === 'assistant' ? (
                    <MarkdownAssistantBubble markdown={m.content} />
                  ) : (
                    <div className="chat-bubble">{m.content}</div>
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="chat-turn chat-turn--assistant" data-role="assistant">
                <div className="chat-avatar" aria-hidden>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26A6.99 6.99 0 0 1 5 9a7 7 0 0 1 7-7zm0 2a5 5 0 0 0-5 5c0 1.88 1.03 3.51 2.55 4.37l.45.26V17h4v-3.37l.45-.26A4.98 4.98 0 0 0 17 9a5 5 0 0 0-5-5zm-1 17h2v1h-2v-1z" />
                  </svg>
                </div>
                <div className="chat-bubble-wrap">
                  <div className="chat-bubble chat-bubble--typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="chat-composer-wrap">
        <div className="chat-composer-inner">
          <textarea
            ref={textareaRef}
            className="chat-input"
            rows={1}
            placeholder="Message MIVI AI…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onComposerKeyDown}
            aria-label="Message"
          />
          <button
            type="button"
            className="chat-send"
            onClick={() => void send()}
            disabled={!input.trim() || isThinking}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
              <path d="M3 11.5v1l17.5 9 2.5-1.3-2.5-17.2L3 11.5zm2.1 1.4L18.4 19l-12-6.1V13h4v-2H8.4l-3.3-1.1z" />
            </svg>
          </button>
        </div>
        <p className="chat-disclaimer">
          MIVI AI can make mistakes. Check important info.
        </p>
      </footer>
    </div>
  )
}
