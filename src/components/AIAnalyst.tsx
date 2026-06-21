import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, GitFork } from 'lucide-react';
import { queryMatchAI, checkLangflowStatus } from '../services/graniteEngine';
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
  const [isLangflowOnline, setIsLangflowOnline] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Monitor Langflow API status
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkLangflowStatus();
      setIsLangflowOnline(status);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Generate AI response
    const aiRes = await queryMatchAI(textToSend, currentMinute, persona);
    
    const assistantMsg: Message = {
      sender: 'assistant',
      text: aiRes.answer,
      confidence: aiRes.confidence,
      sources: aiRes.sources,
      langflowPath: aiRes.langflowPath
    };

    setMessages((prev) => [...prev, assistantMsg]);
    if (aiRes.langflowPath) {
      setActiveWorkflowPath(aiRes.langflowPath);
    }
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
    
    queryMatchAI(userText, currentMinute, persona).then((newAiRes) => {
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
      if (newAiRes.langflowPath) {
        setActiveWorkflowPath(newAiRes.langflowPath);
      }
    });
  }, [persona]);

  return (
    <div className="glass-panel p-5 border-white/5 bg-slate-900/40 flex flex-col gap-4 min-h-[460px] h-[550px]">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-neon-cyan" />
            <h2 className="text-xs font-black uppercase tracking-widest text-white">
              Ask AI Analyst
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isLangflowOnline ? 'bg-neon-green animate-pulse shadow-[0_0_6px_var(--color-neon-green)]' : 'bg-gold shadow-[0_0_6px_var(--color-gold)]'}`} />
            <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-wider">
              {isLangflowOnline ? 'LANGFLOW ONLINE' : 'SIMULATION MODE (LOCAL)'}
            </span>
          </div>
        </div>

        {/* Langflow Toggle Button */}
        <button
          onClick={() => setShowWorkflow(!showWorkflow)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono font-black transition-all border cursor-pointer ${
            showWorkflow
              ? 'bg-neon-purple/20 border-neon-purple text-white shadow-lg'
              : 'bg-slate-800 border-slate-700 text-gray-400 hover:text-white'
          }`}
        >
          <GitFork size={12} />
          <span>WORKFLOW</span>
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden relative">
        
        {/* Chat Feed Column */}
        <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
          
          {/* Persona selector tabs */}
          <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5 shrink-0">
            <button
              onClick={() => setPersona('fan')}
              className={`flex-1 py-1 text-center rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                persona === 'fan'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              ⚽ FAN
            </button>
            <button
              onClick={() => setPersona('coach')}
              className={`flex-1 py-1 text-center rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                persona === 'coach'
                  ? 'bg-neon-cyan/15 text-neon-cyan shadow-md border border-neon-cyan/20'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              📋 COACH
            </button>
            <button
              onClick={() => setPersona('child')}
              className={`flex-1 py-1 text-center rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                persona === 'child'
                  ? 'bg-neon-purple/15 text-neon-purple shadow-md border border-neon-purple/20'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              🧸 CHILD
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble leading-relaxed text-xs p-3.5 rounded-xl font-medium ${
                  msg.sender === 'assistant' 
                    ? 'assistant bg-slate-800/40 border border-white/5 border-l-4 border-l-neon-cyan text-gray-200' 
                    : 'user bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/25 text-white ml-auto max-w-[85%]'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                
                {msg.sender === 'assistant' && msg.confidence && msg.confidence < 100 && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/5 flex flex-wrap justify-between items-center text-[8px] font-mono font-black text-gray-500 gap-2 uppercase tracking-wider">
                    <span>CONFIDENCE: <span className="text-gold font-bold">{msg.confidence}%</span></span>
                    {msg.sources && (
                      <span className="truncate max-w-[150px]">SOURCE: {msg.sources.join(', ')}</span>
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
                className="shrink-0 px-3 py-1 bg-slate-950/60 border border-white/5 hover:border-neon-cyan/35 rounded-full text-[9px] font-black uppercase text-gray-400 hover:text-neon-cyan transition-all tracking-wider cursor-pointer"
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
            className="flex gap-2 border border-white/5 rounded-xl bg-slate-950/80 p-1.5 focus-within:border-neon-cyan/45 transition-all shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about goals, tactics, or rulings..."
              className="flex-1 bg-transparent border-0 outline-none text-xs text-white px-2.5 font-medium placeholder-gray-600"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-neon-cyan text-slate-950 hover:bg-white hover:scale-105 transition-all shrink-0 cursor-pointer flex items-center justify-center"
            >
              <Send size={11} className="fill-current" />
            </button>
          </form>
        </div>

        {/* Langflow Workflow Sidebar (Collapsible) */}
        {showWorkflow && (
          <div className="w-[150px] bg-slate-950/90 border border-white/5 p-3 h-full flex flex-col gap-3 overflow-y-auto shrink-0 animate-fade-in absolute right-0 top-0 bottom-0 z-10 md:relative rounded-xl backdrop-blur-md">
            <span className="text-[9px] font-black uppercase text-neon-purple tracking-widest block border-b border-white/5 pb-1 font-mono">
              WORKFLOW LOGS
            </span>

            {activeWorkflowPath.length === 0 ? (
              <p className="text-[8px] font-mono font-bold text-gray-600 uppercase text-center mt-8 leading-normal">
                Submit query to monitor active node telemetry.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                {activeWorkflowPath.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <div
                      className={`p-2.5 rounded-lg border text-[9px] leading-tight flex flex-col transition-all duration-300 ${
                        node.status === 'completed' 
                          ? 'border-neon-purple/20 bg-neon-purple/5 text-neon-purple' 
                          : node.status === 'active' 
                          ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan animate-pulse shadow-[0_0_8px_rgba(0,216,246,0.15)]'
                          : 'border-white/5 bg-slate-900/40 text-gray-500'
                      }`}
                    >
                      <span className="font-bold text-[9px] text-gray-300">{node.label}</span>
                      <span className="text-[7px] text-gray-500 font-mono mt-0.5 uppercase tracking-wide">
                        {node.type}
                      </span>
                    </div>
                    {index < activeWorkflowPath.length - 1 && (
                      <div className="w-[1.5px] h-3 bg-gradient-to-b from-neon-purple to-neon-cyan mx-auto"></div>
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
