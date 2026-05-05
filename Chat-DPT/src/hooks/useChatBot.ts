import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export type ChatTurnForApi = Pick<ChatMessage, 'role' | 'content'>

export type UseChatBotOptions = {
  /** POST endpoint that accepts `{ messages: { role, content }[] }` and returns JSON with `message` string. */
  chatUrl?: string
}

async function postChat(
  url: string,
  payload: ChatTurnForApi[],
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ messages: payload }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`)
  }
  const data = (await response.json()) as { message?: string }
  return data.message ?? ''
}

export function useChatBot(options?: UseChatBotOptions) {
  const chatUrl = options?.chatUrl ?? 'http://localhost:3000/chat'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking, scrollToBottom])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = '0px'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [input])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || isThinking) return

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: text,
    }
    const conversationForApi: ChatTurnForApi[] = [
      ...messagesRef.current.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: text },
    ]

    setInput('')
    setMessages((prev) => [...prev, userMessage])

    setIsThinking(true)
    try {
      const assistantText = await postChat(chatUrl, conversationForApi)
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          content: assistantText || 'No reply from server.',
        },
      ])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          content: 'Something went wrong. Check the server and try again.',
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }, [input, isThinking, chatUrl])

  const onComposerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void send()
      }
    },
    [send],
  )

  return {
    messages,
    input,
    setInput,
    isThinking,
    send,
    listRef,
    textareaRef,
    onComposerKeyDown,
  }
}
