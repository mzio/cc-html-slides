/**
 * ai-demos.js — Interactive AI demo widgets
 *
 * - ai-chat: Simulated chat with typing indicator + pre-scripted responses
 * - code-gen: Simulated code generation with syntax highlighting
 */
const AIDemos = (() => {

  /* ============================
     Inject styles
     ============================ */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ---- Chat Widget ---- */
      .ai-chat-widget {
        width: 100%;
        max-width: 600px;
        margin: 1rem auto;
        background: var(--bg-surface);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        overflow: hidden;
        text-align: left;
      }
      .ai-chat-header {
        padding: 0.75rem 1.25rem;
        background: rgba(0,240,255,0.05);
        border-bottom: 1px solid rgba(255,255,255,0.06);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .ai-chat-header .dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: var(--accent-green);
        animation: pulse-dot 2s ease infinite;
      }
      @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .ai-chat-header span {
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 600;
      }
      .ai-chat-messages {
        padding: 1rem 1.25rem;
        min-height: 200px;
        max-height: 350px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .chat-msg {
        max-width: 85%;
        padding: 0.6rem 1rem;
        border-radius: 12px;
        font-size: 0.95rem;
        line-height: 1.4;
        animation: msgIn 0.3s ease;
      }
      @keyframes msgIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .chat-msg.user {
        align-self: flex-end;
        background: rgba(139,92,246,0.2);
        color: var(--text-primary);
        border-bottom-right-radius: 4px;
      }
      .chat-msg.ai {
        align-self: flex-start;
        background: rgba(0,240,255,0.08);
        color: var(--text-primary);
        border-bottom-left-radius: 4px;
      }
      .chat-typing {
        align-self: flex-start;
        display: flex;
        gap: 4px;
        padding: 0.6rem 1rem;
      }
      .chat-typing .dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: var(--accent-cyan);
        animation: typingBounce 1.2s ease infinite;
      }
      .chat-typing .dot:nth-child(2) { animation-delay: 0.15s; }
      .chat-typing .dot:nth-child(3) { animation-delay: 0.3s; }
      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
        30% { transform: translateY(-6px); opacity: 1; }
      }
      .ai-chat-input {
        padding: 0.75rem 1.25rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        gap: 0.5rem;
      }
      .ai-chat-input input {
        flex: 1;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        color: var(--text-primary);
        font-size: 0.9rem;
        outline: none;
        font-family: inherit;
      }
      .ai-chat-input input:focus {
        border-color: rgba(0,240,255,0.3);
      }
      .ai-chat-input input::placeholder {
        color: var(--text-muted);
      }
      .ai-chat-input button {
        background: var(--gradient-accent);
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        color: var(--bg-deep);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .ai-chat-input button:hover {
        opacity: 0.85;
      }

      /* ---- Code Gen Widget ---- */
      .code-gen-widget {
        width: 100%;
        max-width: 700px;
        margin: 1rem auto;
        background: var(--bg-surface);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        overflow: hidden;
        text-align: left;
      }
      .code-gen-header {
        padding: 0.6rem 1.25rem;
        background: rgba(0,240,255,0.05);
        border-bottom: 1px solid rgba(255,255,255,0.06);
        font-size: 0.8rem;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .code-gen-header .lang-badge {
        background: rgba(0,240,255,0.1);
        color: var(--accent-cyan);
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .code-gen-body {
        padding: 1rem 1.25rem;
        min-height: 180px;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 0.85rem;
        line-height: 1.6;
        color: var(--text-primary);
        white-space: pre-wrap;
        overflow-x: auto;
      }
      .code-gen-body .cursor-line {
        display: inline;
        border-right: 2px solid var(--accent-cyan);
        animation: blink 0.8s step-end infinite;
      }
    `;
    document.head.appendChild(style);
  }

  injectStyles();

  /* ============================
     AI Chat Widget
     ============================ */

  // Default conversation script
  const DEFAULT_SCRIPT = [
    { role: 'user', text: 'Analyze our Q4 customer churn data' },
    { role: 'ai', text: 'I\'ve analyzed 12,847 customer records from Q4. Key findings:\n\n• Churn rate: 4.2% (down from 6.1% in Q3)\n• Top churn predictor: No login in 14+ days (73% correlation)\n• At-risk segment: Mid-market accounts with <3 integrations\n\nShall I generate a retention playbook for the at-risk segment?' },
    { role: 'user', text: 'Yes, and predict revenue impact' },
    { role: 'ai', text: 'Generated retention playbook with 5 action items. Revenue impact analysis:\n\n• Without intervention: projected $2.4M ARR loss\n• With playbook execution: reduces to $680K (72% recovery)\n• ROI on retention program: 8.3x\n• Recommended budget allocation: $290K\n\nFull report exported to your dashboard.' },
  ];

  function createChat(el, content) {
    // Parse script from content or use default
    let script = DEFAULT_SCRIPT;
    if (content && content.trim()) {
      script = parseChatScript(content);
    }

    el.classList.add('ai-chat-widget');
    el.innerHTML = `
      <div class="ai-chat-header">
        <div class="dot"></div>
        <span>NeuralFlow AI Assistant</span>
      </div>
      <div class="ai-chat-messages"></div>
      <div class="ai-chat-input">
        <input type="text" placeholder="Ask the AI anything..." />
        <button>Send</button>
      </div>
    `;

    el._chatScript = script;
    el._chatIndex = 0;
    el._chatRunning = false;

    // Bind input for interactive demo
    const input = el.querySelector('input');
    const btn = el.querySelector('button');
    const sendMsg = () => {
      const text = input.value.trim();
      if (!text) return;
      addMessage(el, 'user', text);
      input.value = '';
      // Show typing then generic response
      showTyping(el);
      setTimeout(() => {
        removeTyping(el);
        addMessage(el, 'ai', 'That\'s a great question! Based on our data analysis, I can provide detailed insights on that topic. Let me process the information and generate a comprehensive report for you.');
      }, 1500);
    };
    btn.addEventListener('click', sendMsg);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMsg();
    });
  }

  function parseChatScript(content) {
    const decoded = content.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const lines = decoded.split('\n');
    const script = [];
    let current = null;

    lines.forEach(line => {
      const match = line.match(/^(user|ai):\s*(.*)$/);
      if (match) {
        if (current) script.push(current);
        current = { role: match[1], text: match[2] };
      } else if (current) {
        current.text += '\n' + line;
      }
    });
    if (current) script.push(current);
    return script.length > 0 ? script : DEFAULT_SCRIPT;
  }

  function runChatDemo(el) {
    if (el._chatRunning) return;
    el._chatRunning = true;
    el._chatIndex = 0;
    const msgs = el.querySelector('.ai-chat-messages');
    msgs.innerHTML = '';
    playNextMessage(el);
  }

  function playNextMessage(el) {
    const script = el._chatScript;
    if (el._chatIndex >= script.length) {
      el._chatRunning = false;
      return;
    }

    const msg = script[el._chatIndex];
    el._chatIndex++;

    if (msg.role === 'user') {
      addMessage(el, 'user', msg.text);
      setTimeout(() => {
        showTyping(el);
        setTimeout(() => {
          removeTyping(el);
          playNextMessage(el);
        }, 800 + Math.random() * 600);
      }, 600);
    } else {
      // Type out AI response character by character
      const msgEl = addMessage(el, 'ai', '');
      typeOutMessage(msgEl, msg.text, () => {
        setTimeout(() => playNextMessage(el), 800);
      });
    }
  }

  function typeOutMessage(msgEl, text, callback) {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        // Add multiple chars at once for speed
        const chunk = text.substring(i, i + 2);
        msgEl.textContent += chunk;
        i += 2;
        // Auto scroll
        const container = msgEl.closest('.ai-chat-messages');
        if (container) container.scrollTop = container.scrollHeight;
      } else {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 20);
  }

  function addMessage(el, role, text) {
    const msgs = el.querySelector('.ai-chat-messages');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping(el) {
    const msgs = el.querySelector('.ai-chat-messages');
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping(el) {
    const typing = el.querySelector('.chat-typing');
    if (typing) typing.remove();
  }

  /* ============================
     Code Generation Widget
     ============================ */

  const DEFAULT_CODE = `import neuralflow as nf

# Initialize the AI pipeline
pipeline = nf.Pipeline(
    model="nf-enterprise-v3",
    context_window=128000,
    tools=["data_analysis", "forecasting", "reporting"]
)

# Analyze customer data
results = pipeline.analyze(
    source="customer_db",
    query="churn prediction Q4",
    confidence_threshold=0.92
)

# Generate actionable insights
report = pipeline.generate_report(
    results,
    format="executive_summary",
    include_recommendations=True
)

print(f"Analysis complete: {results.accuracy:.1%} accuracy")
print(f"At-risk accounts identified: {results.flagged_count}")`;

  function createCodeGen(el, content) {
    const code = (content && content.trim())
      ? content.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : DEFAULT_CODE;

    el.classList.add('code-gen-widget');
    el.innerHTML = `
      <div class="code-gen-header">
        <span class="lang-badge">Python</span>
        <span>NeuralFlow SDK — Live Generation</span>
      </div>
      <div class="code-gen-body"><span class="code-gen-text"></span><span class="cursor-line"> </span></div>
    `;

    el._codeText = code;
  }

  function runCodeGen(el) {
    const code = el._codeText;
    if (!code) return;
    const textEl = el.querySelector('.code-gen-text');
    const cursorEl = el.querySelector('.cursor-line');
    if (!textEl) return;

    textEl.textContent = '';
    let i = 0;

    const interval = setInterval(() => {
      if (i < code.length) {
        const chunk = code.substring(i, i + 3);
        textEl.textContent += chunk;
        i += 3;
        // Keep cursor visible
        const body = el.querySelector('.code-gen-body');
        if (body) body.scrollTop = body.scrollHeight;
      } else {
        clearInterval(interval);
        // Apply syntax highlighting after generation completes
        if (window.hljs) {
          const highlighted = hljs.highlight(textEl.textContent, { language: 'python' }).value;
          textEl.innerHTML = highlighted;
        }
        if (cursorEl) cursorEl.style.display = 'none';
      }
    }, 25);
  }

  /* ============================
     Slide Enter Hook
     ============================ */
  function onSlideEnter(slideEl) {
    // Auto-play chat demos
    slideEl.querySelectorAll('.ai-chat-widget').forEach(runChatDemo);
    // Auto-play code gen demos
    slideEl.querySelectorAll('.code-gen-widget').forEach(runCodeGen);
  }

  return { createChat, createCodeGen, onSlideEnter };
})();
