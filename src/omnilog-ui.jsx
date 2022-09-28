import { white, cyan, yellow, red, magenta, darkGray } from 'ansicolor';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LazyLog } from 'react-lazylog';

const messages = [];
chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.namespace !== 'omnilog') {
    return;
  }
  messages.push({ request, sender });
  console[request.type](request, sender);
});

const Omnilog = () => {
  const [log, setLog] = useState('\0');
  useEffect(() => {
    const interval = setInterval(() => {
      while (messages.length > 0) {
        const message = messages.shift();
        setLog(log => {
          const { type, args, source, href, when, stack } = message.request;
          const newLine = log === '\0' ? '' : '\n';
          let text = args.join(' ');
          // 'log', 'info', 'warn', 'error'
          if (type === 'log') {
            text = white(text);
          } else if (type === 'info') {
            text = cyan(text);
          } else if (type === 'warn') {
            text = yellow(text);
          } else if (type === 'error') {
            text = red(text);
          } else if (type === 'debug') {
            text = magenta(text);
          }
          return (
            log +
            `${newLine}${text}\t${darkGray(
              `(${source}, ${href}, ${when}, ${stack.split('at ').at(-1)})}`
            )}`
          );
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          padding: '0 10px',
          color: '#666666',
          height: '46px',
          gap: '0.75em',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'calc(100% - 333px)',
          boxSizing: 'border-box',
        }}
      >
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
              chrome.runtime.reload();
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
              setLog('\0');
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
      <LazyLog
        text={log}
        selectableLines={true}
        enableSearch={true}
        style={{ backgroundColor: '#1b1b1b' }}
      />
    </>
  );
};

createRoot(document.getElementById('app')).render(<Omnilog />);
