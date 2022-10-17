import React, { useLayoutEffect, useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { createUseStyles } from 'react-jss'
import toast, { Toaster } from 'react-hot-toast'
import { JsonViewer } from '@textea/json-viewer'

let onMessage = null
let messageIndex = 0
let messages = []
chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.namespace !== 'omnilog') {
    return
  }
  messages.push({ request, sender })
  console[request.type](request, sender)
  onMessage?.()
})

const toolbarHeight = '46px'
const useStyles = createUseStyles({
  toolbar: {
    display: 'flex',
    padding: '0 10px',
    backgroundColor: '#222222',
    color: '#666666',
    height: toolbarHeight,
    gap: '0.75em',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    position: 'fixed',
    zIndex: 100,
  },
  headings: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    position: 'sticky',
    top: toolbarHeight,
    backgroundColor: '#1b1b1b',
    color: '#555',
    zIndex: 99,
  },
  heading: {
    display: 'flex',
    gap: '2.3em',
  },

  logger: {
    paddingTop: toolbarHeight,
  },

  objectView: {
    fontFamily: '"Monaco", monospace !important',
    background: 'unset !important',
    backgroundImage: 'unset !important',
    backgroundColor: 'unset !important',
    '& .int-value': {
      color: '#608cd2 !important',
    },
  },
})

const hrefRegex = /(^chrome-extension:\/\/)([a-z]\w+)(\/.*)/
function prettyHref(href) {
  const match = hrefRegex.exec(href)
  if (match) {
    return `${match[1]}${match[2].substring(0, 5) + '…'}${match[3]}`.replace(
      'chrome-extension://',
      'chrome-ext…://',
    )
  }
  return href
}

const typeSymbols = {
  log: <span style={{ color: '#d6d6d6' }}>◦</span>,
  info: <span style={{ color: '#2ab4fe' }}>ℹ</span>,
  warn: <span style={{ color: '#ffca00' }}>⚠</span>,
  error: <span style={{ color: '#ff2a2a' }}>✖</span>,
  debug: <span style={{ color: '#70ce83' }}>⚙</span>,
}

const useRowStyles = createUseStyles({
  row: {
    minWidth: '100%',
    display: 'inline-flex',
    '& > a:before': {
      content: 'attr(id)',
    },
    contentVisibility: 'auto',
    containIntrinsicSize: 'auto 19px',
    '&:hover': {
      backgroundColor: '#262626',
    },
    '&:has(a:target)': {
      backgroundColor: '#262626',
    },
    '&.error': {
      backgroundColor: '#250e0e',
    },
    '&.error:hover': {
      backgroundColor: '#331414',
    },
    '&.warn': {
      backgroundColor: '#25200e',
    },
    '&.warn:hover': {
      backgroundColor: '#342d14',
    },
  },
  lineNumber: {
    fontFamily: '"Monaco", monospace',
    fontSize: '12px',
    whiteSpace: 'pre',
    fontWeight: 400,
    lineHeight: '19px',
    display: 'inline-block',
    color: '#666',
    userSelect: 'none',
    textAlign: 'right',
    minWidth: '45px',
    cursor: 'pointer',
    textDecoration: 'none',
    padding: '0 0.5em',
  },
  lineText: {
    flex: '1 1 auto',
    fontFamily: '"Monaco", monospace',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    color: '#d6d6d6',
    fontWeight: 400,
    lineHeight: '19px',
    userSelect: 'text',
    overflowWrap: 'break-word',
  },
  trace: {
    cursor: 'pointer',
    '&.no-copy': {
      cursor: 'auto',
    },
    opacity: 0.5,
    float: 'right',
    padding: '0 5px',
    '&:not(.no-copy):hover': {
      opacity: 1,
      backgroundColor: '#444',
    },
  },
  copyStack: {
    '&:before': {
      content: 'attr(data-content)',
    },
    '&:hover:before': {
      content: "'STACK'",
    },
  },
})

const writeText = async (text) => {
  await navigator.clipboard.writeText(text)

  toast(
    () => (
      <span>
        Copied to clipboard:
        <pre>{text}</pre>
      </span>
    ),
    {
      icon: '📋',
      style: {
        borderRadius: '0px',
        background: '#444',
        color: '#d6d6d6',
        maxWidth: '95vw',
      },
    },
  )
}

const removeLines = (str, num) => {
  const lines = str.split('\n')
  return lines.slice(num).join('\n')
}

const getLastWord = (str) => {
  const words = str.split(' ')
  return words[words.length - 1]
}

const resolveBacktrace = (source, stack) => {
  if (source) {
    return { path: source.replace(/^\//, '') }
  } else if (stack) {
    const lastLine =
      removeLines(stack, 3)?.split('\n')[0] || stack.split('at ').at(-1)
    const sourceMatch = getLastWord(lastLine).match(
      /^\(?((.*):(\d+):(\d+))\)?$/,
    )
    if (sourceMatch) {
      let path
      try {
        path = new URL(sourceMatch[1]).pathname
      } catch {
        path = sourceMatch[1]
      }
      return {
        url: sourceMatch[1],
        path: path,
      }
    }
  } else {
    return {}
  }
}

const Row = ({ children, id, text, type, source, href, when, stack }) => {
  const classes = useRowStyles()
  const dateTime = new Date(when)
  const backTrace = resolveBacktrace(source, stack)
  return (
    <div className={`${classes.row} ${type}`}>
      <a
        className={classes.lineNumber}
        id={id}
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          writeText(text)
        }}
      >
        {' '}
        <span style={{ fontSize: '14px' }}>{typeSymbols[type]}</span>
      </a>
      <span className={classes.lineText}>
        <span
          className={classes.trace}
          title={dateTime.toLocaleString()}
          onClick={() => writeText(dateTime.toISOString())}
        >
          {dateTime.toTimeString().split(' ')[0]}
        </span>
        <span
          className={`${classes.trace} ${classes.copyStack}`}
          data-content={type?.toUpperCase().padStart(5)}
          onClick={() =>
            writeText(removeLines(stack, 3).replaceAll('    at ', ''))
          }
        ></span>
        <span
          className={classes.trace}
          title={href}
          onClick={() => writeText(href)}
        >
          {prettyHref(href)}
        </span>

        <span
          className={classes.trace}
          onClick={() => writeText(backTrace.url || backTrace.path)}
        >
          {prettyHref(backTrace.path)}
        </span>
        <span className="text">{children}</span>
      </span>
    </div>
  )
}

const Omnilog = () => {
  const classes = useStyles()

  const loggerRef = useRef(null)

  useLayoutEffect(() => {
    document.body.style.backgroundColor = '#1b1b1b'
    document.documentElement.style.scrollPaddingTop = parseInt(toolbarHeight) + 14 + 'px'
  }, [])

  useEffect(() => {
    onMessage = () => {
      messages.slice(messageIndex).forEach(({ request }, index) => {
        const { type, args, source, href, when, stack } = request
        const text = args
          .map((arg) => {
            if (arg === '$ol_type_undefined') {
              return 'undefined'
            }
            if (typeof arg === 'object') {
              return JSON.stringify(arg, null, 2)
            }
            return arg
          })
          .join(' ')

        const content = args.map((arg, index) => {
          const suffix = index === args.length - 1 ? '' : ' '
          if (
            arg === null ||
            arg === undefined ||
            arg === '$ol_type_undefined'
          ) {
            return (
              <span key={index} style={{ opacity: 0.5 }}>
                {String(arg === '$ol_type_undefined' ? undefined : arg)}
                {suffix}
              </span>
            )
          }
          if (typeof arg === 'object') {
            return (
              <JsonViewer
                key={index}
                value={arg}
                theme="dark"
                rootName="Object"
                defaultInspectDepth={0}
                displayDataTypes={false}
                editable={false}
                className={classes.objectView}
              />
            )
          }
          if (typeof arg === 'number') {
            return (
              <span key={index} style={{ color: '#608cd2' }}>
                {arg}
                {suffix}
              </span>
            )
          }
          if (typeof arg === 'boolean') {
            return (
              <span key={index} style={{ color: '#ba8baf' }}>
                {String(arg)}
                {suffix}
              </span>
            )
          }
          if (arg.endsWith('$ol_type_bigint')) {
            return (
              <span key={index} style={{ color: '#a1b56c' }}>
                {arg.split('$ol_type_bigint')[0] + 'n'}
                {suffix}
              </span>
            )
          }
          return (
            <span key={index}>
              {arg}
              {suffix}
            </span>
          )
        })

        // check if scrolled to the end of the document before appending
        const { scrollTop, scrollHeight, clientHeight } =
          document.scrollingElement
        if (scrollTop + clientHeight >= scrollHeight - 40) {
          // 40px buffer
          // scroll to the end of the document after appending
          setTimeout(() => {
            document.scrollingElement.scrollTo({
              top: scrollHeight,
              behavior: 'smooth',
            })
          }, 100)
        }

        const rowRoot = document.createElement('div')
        createRoot(rowRoot).render(
          <Row
            id={messageIndex + index + 1}
            type={type}
            source={source}
            href={href}
            when={when}
            stack={stack}
            text={text}
          >
            {content}
          </Row>,
        )
        loggerRef.current.appendChild(rowRoot)
        messageIndex = messageIndex + 1
      })
    }
    return () => (onMessage = null)
  }, [])

  return (
    <>
      <div className={classes.toolbar}>
        <div>
          <h3 style={{ margin: '0' }}>Omnilog</h3>
          <span>{chrome.runtime.getManifest().name}</span>
        </div>
        <div>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#464646',
              fill: '#464646',
              cursor: 'pointer',
            }}
            title="Reload Extension"
            onClick={() => {
              chrome.runtime.reload()
            }}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              style={{ height: '20px' }}
            >
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path>
            </svg>
          </button>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#464646',
              fill: '#464646',
              cursor: 'pointer',
            }}
            title="Clear Console"
            onClick={() => {
              messages = []
              messageIndex = 0
              loggerRef.current.replaceChildren()
            }}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              style={{ height: '20px' }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className={classes.headings}>
        <div className={classes.heading}>
          <span></span>
          <span>#</span>
          <span style={{ marginLeft: '-6px' }}>Message</span>
        </div>
        <div className={classes.heading}>
          <span style={{ margin: '0 6vw' }}>Trace</span>
          <span style={{ margin: '0 6vw' }}>Origin</span>
          <span style={{ marginRight: '-10px' }}>Level</span>
          <span style={{ marginLeft: '-8px', marginRight: '8px' }}>Time</span>
          <span></span>
        </div>
      </div>
      <div ref={loggerRef} className={classes.logger} />
      <Toaster />
    </>
  )
}

createRoot(document.getElementById('app')).render(<Omnilog />)
