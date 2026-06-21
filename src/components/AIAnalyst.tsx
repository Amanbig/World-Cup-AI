import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, GitFork } from 'lucide-react';
import { queryMatchAI } from '../services/graniteEngine';
import type { AIResponse } from '../services/graniteEngine';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  langflowPath?: AIResponse['langflowPath'];
  confidence?: number;
  sources?: string[];
}

interface AIAnalystProps {
  currentMinute: number;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ currentMinute }) => {
  const [persona, setPersona] = useState<'fan' | 'coach' | 'child'>('fan');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [activeWorkflowPath, setActiveWorkflowPath] = useState<AIResponse['langflowPath']>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested questions based on the current match time
  const getSuggestedQuestions = (minute: number) => {
    const questions = [];
    if (minute < 20) {
      questions.push('Why is Argentina favored in this match?');
      questions.push('What are the starting formations?');
    } else if (minute < 41) {
      questions.push('Was the 21st minute penalty decision correct?');
      questions.push('Why did Argentina score the counter-attack?');
    } else if (minute < 80) {
      questions.push('Why did France make substitutions at 41\'?');
      questions.push('What did Scaloni change at 64\'?');
    } else if (minute < 100) {
      questions.push('How did Mbappe score two goals in 97 seconds?');
      questions.push('Why did Argentina lose momentum?');
    } else {
      questions.push('Why was Messi\'s 108th minute goal allowed?');
      questions.push('How did Argentina adjust in Extra Time?');
      questions.push('What was the main mistake in the 116th minute handball?');
    }
    return questions;
  };

  const suggestions = getSuggestedQuestions(currentMinute);

  // Initialize welcome message
  useEffect(() => {
    setMessages([
      {
        sender: 'assistant',
        text: `Welcome! I am your Granite-powered Football Analyst. I am currently monitoring the match at the **${currentMinute}th minute**. You can switch my persona below, choose a quick query, or ask me anything about the tactics, VAR decisions, or predictions!`,
        confidence: 100,
        sources: ['FIFA Match Metadata']
      }
    ]);
  }, [currentMinute]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { sender: 'user', text: textToSend };
    
    // Generate AI response
    const aiRes = queryMatchAI(textToSend, currentMinute, persona);
    
    const assistantMsg: Message = {
      sender: 'assistant',
      text: aiRes.answer,
      confidence: aiRes.confidence,
      sources: aiRes.sources,
      langflowPath: aiRes.langflowPath
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setActiveWorkflowPath(aiRes.langflowPath);
    setInputValue('');
  };

  // If persona changes, update the last AI message to match the new persona tone
  useEffect(() => {
    if (messages.length < 2) return;
    
    // Find the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userText = messages[lastUserIndex].text;
    const newAiRes = queryMatchAI(userText, currentMinute, persona);
    
    setMessages((prev) => {
      const copy = [...prev];
      // Update last assistant message (which is after lastUserIndex)
      copy[lastUserIndex + 1] = {
        sender: 'assistant',
        text: newAiRes.answer,
        confidence: newAiRes.confidence,
        sources: newAiRes.sources,
        langflowPath: newAiRes.langflowPath
      };
      return copy;
    });

    setActiveWorkflowPath(newAiRes.langflowPath);
  }, [persona]);

  return (
    <div className="glass-panel p-5 border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.45)] flex flex-col gap-4 min-h-[460px] h-[550px]">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[var(--neon-cyan)]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            Ask AI Analyst
          </h2>
        </div>

        {/* Langflow Toggle Button */}
        <button
          onClick={() => setShowWorkflow(!showWorkflow)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
            showWorkflow
              ? 'bg-[var(--neon-purple)]/20 border-[var(--neon-purple)] text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          <GitFork size={12} />
          <span>LANGFLOW LOGS</span>
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden relative">
        
        {/* Chat Feed Column */}
        <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
          
          {/* Persona selector tabs */}
          <div className="flex gap-1.5 bg-gray-950 p-1 rounded-xl border border-[rgba(255,255,255,0.05)]">
            <button
              onClick={() => setPersona('fan')}
              className={`flex-1 py-1 text-center rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                persona === 'fan'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚽ STANDARD FAN
            </button>
            <button
              onClick={() => setPersona('coach')}
              className={`flex-1 py-1 text-center rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                persona === 'coach'
                  ? 'bg-[rgba(0,216,246,0.15)] text-[var(--neon-cyan)] shadow-md border border-[rgba(0,216,246,0.2)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 PRO COACH
            </button>
            <button
              onClick={() => setPersona('child')}
              className={`flex-1 py-1 text-center rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                persona === 'child'
                  ? 'bg-[rgba(157,78,221,0.15)] text-[var(--neon-purple)] shadow-md border border-[rgba(157,78,221,0.2)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🧸 10-YEAR OLD
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  msg.sender === 'assistant' ? 'assistant' : 'user'
                }`}
              >
                <p>{msg.text}</p>
                
                {msg.sender === 'assistant' && msg.confidence && msg.confidence < 100 && (
                  <div className="mt-2.5 pt-2 border-t border-gray-850 flex flex-wrap justify-between items-center text-[9px] text-[var(--text-muted)] gap-2">
                    <span className="font-mono">Confidence: <span className="text-[var(--gold)] font-bold">{msg.confidence}%</span></span>
                    {msg.sources && (
                      <span className="truncate max-w-[150px]">Source: {msg.sources.join(', ')}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Chip Carousel */}
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none shrink-0 select-none">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="shrink-0 px-3 py-1 bg-gray-900 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,216,246,0.35)] rounded-full text-[10px] text-gray-300 hover:text-[var(--neon-cyan)] transition-all font-medium"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex gap-2 border border-gray-800 rounded-xl bg-gray-950 p-1.5 focus-within:border-[var(--neon-cyan)] transition-all shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about goals, fouls, rules, or tactics..."
              className="flex-1 bg-transparent border-0 outline-none text-xs text-white px-2.5"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-[var(--neon-cyan)] text-black hover:bg-white hover:scale-105 transition-all shrink-0"
            >
              <Send size={12} />
            </button>
          </form>
        </div>

        {/* Langflow Workflow Sidebar (Collapsible) */}
        {showWorkflow && (
          <div className="w-[160px] bg-gray-950 border-l border-gray-800 p-3 h-full flex flex-col gap-3 overflow-y-auto shrink-0 animate-fade-in absolute right-0 top-0 bottom-0 z-10 md:relative">
            <span className="text-[9px] font-black uppercase text-[var(--neon-purple)] tracking-widest block border-b border-gray-800 pb-1">
              Langflow Pipe
            </span>

            {activeWorkflowPath.length === 0 ? (
              <p className="text-[9px] text-[var(--text-muted)] italic text-center mt-6">
                Submit a query to view active node highlights.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                {activeWorkflowPath.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <div
                      className={`langflow-node ${
                        node.status === 'completed' ? 'completed' : ''
                      } ${node.status === 'active' ? 'active' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-[9px]">{node.label}</span>
                        <span className="text-[7px] text-[var(--text-muted)] font-mono">
                          {node.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {index < activeWorkflowPath.length - 1 && (
                      <div className="langflow-arrow"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
