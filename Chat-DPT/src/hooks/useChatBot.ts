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
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ messages: payload }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      const lines = chunk.split('\n')
      let eventType = 'message'
      let dataStr = ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          dataStr = line.slice(6).trim()
        }
      }

      if (dataStr) {
        try {
          const data = JSON.parse(dataStr)
          if (data.content) {
            onChunk(data.content)
          }
        } catch (e) {
          console.error('Failed to parse SSE data', dataStr, e)
        }
      }

      boundary = buffer.indexOf('\n\n')
    }
  }
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
    const assistantMessageId = createId()

    const conversationForApi: ChatTurnForApi[] = [
      ...messagesRef.current.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: text },
    ]

    setInput('')
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      },
    ])

    setIsThinking(true)
    try {
      await postChat(chatUrl, conversationForApi, (chunk) => {
        setMessages((prev) => {
          const updated = [...prev]
          const idx = updated.findIndex((m) => m.id === assistantMessageId)
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              content: updated[idx].content + chunk,
            }
          }
          return updated
        })
      })
    } catch (error) {
      console.error(error, 'error')
      setMessages((prev) => {
        const updated = [...prev]
        const idx = updated.findIndex((m) => m.id === assistantMessageId)
        if (idx !== -1 && !updated[idx].content) {
          updated[idx] = {
            ...updated[idx],
            content: 'Something went wrong. Check the server and try again.',
          }
        }
        return updated
      })
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
