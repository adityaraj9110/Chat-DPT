import hljs from 'highlight.js'
import {
  memo,
  useMemo,
  type ComponentType,
  type ReactNode,
} from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.min.css'

function createMarkdownComponents(): Components {
  return {
    code({ className, children, ...rest }) {
      const match = /language-(\w+)/.exec(className || '')
      const codeText = String(children).replace(/\n$/, '')

      if (!match) {
        return (
          <code className={className} {...rest}>
            {children}
          </code>
        )
      }

      const language = match[1]
      let highlighted: string
      try {
        highlighted = hljs.highlight(codeText, { language }).value
      } catch {
        highlighted = hljs.highlightAuto(codeText).value
      }

      return (
        <code
          className={['hljs', className].filter(Boolean).join(' ')}
          // Trusted: highlight.js escapes markup in source text.
          dangerouslySetInnerHTML={{ __html: highlighted }}
          {...rest}
        />
      )
    },
  }
}

const remarkPlugins = [remarkGfm]

export const AssistantMarkdown = memo(function AssistantMarkdown({
  source,
}: {
  source: string
}) {
  const components = useMemo(createMarkdownComponents, [])

  return (
    <div className="chat-markdown-root">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {source ?? ''}
      </ReactMarkdown>
    </div>
  )
})

type BubbleWrapperProps = { children: ReactNode; className?: string }

/**
 * HOC: wraps a bubble/container so it receives rendered assistant markdown as `children`.
 */
export function withAssistantMarkdownBubble(
  Wrapper: ComponentType<BubbleWrapperProps>,
) {
  const WithMarkdown = memo(function WithMarkdownBubble({
    markdown,
    className,
  }: {
    markdown: string
    className?: string
  }) {
    return (
      <Wrapper className={className}>
        <AssistantMarkdown source={markdown} />
      </Wrapper>
    )
  })
  WithMarkdown.displayName = `WithAssistantMarkdown(${Wrapper.displayName ?? Wrapper.name ?? 'Wrapper'})`
  return WithMarkdown
}

function AssistantBubbleChrome({ children, className }: BubbleWrapperProps) {
  return (
    <div
      className={['chat-bubble', 'chat-bubble--markdown', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

/** Assistant bubble with GFM + syntax highlighting (no rehype-highlight — avoids HAST / visit crash with react-markdown 10). */
export const MarkdownAssistantBubble = withAssistantMarkdownBubble(
  AssistantBubbleChrome,
)
