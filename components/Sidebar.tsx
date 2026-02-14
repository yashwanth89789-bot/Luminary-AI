import React, { useState, useRef, useEffect } from 'react';
import { Highlight, HighlightCategory, ThemePalette, SavedDocument, ChatMessage } from '../types';
import { MODES } from '../constants';
import { Trash2, ExternalLink, History, Layers, Plus, FileText, Clock, MessageSquare, Send, Sparkles, Bot } from 'lucide-react';

interface SidebarProps {
  highlights: Highlight[];
  summary?: string;
  chatHistory: ChatMessage[];
  palette: ThemePalette;
  onDeleteHighlight: (id: string) => void;
  onJumpToHighlight: (id: string) => void;
  
  // Chat Props
  onSendChatMessage: (text: string) => Promise<void>;
  isChatLoading: boolean;

  // History Props
  documents: SavedDocument[];
  activeDocId: string;
  onSelectDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onCreateDocument: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  highlights, 
  summary,
  chatHistory,
  palette, 
  onDeleteHighlight, 
  onJumpToHighlight,
  onSendChatMessage,
  isChatLoading,
  documents,
  activeDocId,
  onSelectDocument,
  onDeleteDocument,
  onCreateDocument
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'chat' | 'history'>('highlights');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput;
    setChatInput('');
    await onSendChatMessage(msg);
  };

  // Group highlights by category
  const groupedHighlights = highlights.reduce((acc, highlight) => {
    if (!acc[highlight.category]) acc[highlight.category] = [];
    acc[highlight.category].push(highlight);
    return acc;
  }, {} as Record<HighlightCategory, Highlight[]>);

  const categoriesOrder = [
    HighlightCategory.IMPORTANT,
    HighlightCategory.WARNING,
    HighlightCategory.ACTION,
    HighlightCategory.FACT,
    HighlightCategory.CUSTOM
  ];

  return (
    <div className="h-full flex flex-col bg-surface border-l border-gray-700 w-full md:w-80 lg:w-96 overflow-hidden">
      
      {/* Tabs Header */}
      <div className="flex items-center border-b border-gray-700 bg-surface z-10">
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 py-3 text-xs font-medium flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${
            activeTab === 'highlights' 
              ? 'border-blue-500 text-blue-400 bg-gray-800/30' 
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Insights</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs font-medium flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${
            activeTab === 'chat' 
              ? 'border-blue-500 text-blue-400 bg-gray-800/30' 
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask AI</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-xs font-medium flex flex-col items-center justify-center gap-1 border-b-2 transition-colors ${
            activeTab === 'history' 
              ? 'border-blue-500 text-blue-400 bg-gray-800/30' 
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        
        {/* HIGHLIGHTS VIEW */}
        {activeTab === 'highlights' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* AI Summary Card */}
            {summary && (
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">AI Summary</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {summary}
                </p>
              </div>
            )}

            {highlights.length === 0 && !summary ? (
              <div className="text-center text-gray-500 mt-10 p-4">
                <p className="mb-2">No analysis yet.</p>
                <p className="text-sm">Click "AI Analyze" to generate highlights and a summary.</p>
              </div>
            ) : (
              categoriesOrder.map(cat => {
                const items = groupedHighlights[cat];
                if (!items?.length) return null;
                const modeMeta = MODES[cat];
                const colors = palette[cat];

                return (
                  <div key={cat} className="space-y-3">
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${colors.color.replace('text-', 'text-opacity-80 ')}`}>
                      {modeMeta.icon}
                      {modeMeta.label}
                    </h3>
                    
                    <div className="space-y-3">
                      {items.map(highlight => (
                        <div 
                          key={highlight.id}
                          className="group relative bg-background/50 rounded-lg p-3 border border-gray-700 hover:border-gray-500 transition-colors"
                        >
                          <p 
                            className="text-sm text-gray-300 line-clamp-3 mb-2 cursor-pointer hover:text-white"
                            onClick={() => onJumpToHighlight(highlight.id)}
                          >
                            "{highlight.text}"
                          </p>
                          
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                            <span className="text-[10px] text-gray-500 font-mono">
                              Index: {highlight.startIndex}
                            </span>
                            <div className="flex gap-1">
                               <button 
                                onClick={() => onJumpToHighlight(highlight.id)}
                                className="p-1.5 text-gray-500 hover:text-blue-400 rounded-md transition-colors"
                                title="Scroll to highlight"
                              >
                                <ExternalLink size={14} />
                              </button>
                              <button 
                                onClick={() => onDeleteHighlight(highlight.id)}
                                className="p-1.5 text-gray-500 hover:text-rose-400 rounded-md transition-colors"
                                title="Remove highlight"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CHAT VIEW */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            {chatHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center p-4">
                <div className="bg-gray-800 p-3 rounded-full mb-3">
                  <Bot className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm">Ask questions about this document.</p>
                <p className="text-xs mt-1 text-gray-600">"What is the main conclusion?"</p>
              </div>
            ) : (
              <div className="flex-1 space-y-4 mb-4">
                {chatHistory.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`
                        max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed
                        ${msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}
                      `}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                     <div className="bg-gray-800 rounded-2xl rounded-bl-none p-3 border border-gray-700">
                       <div className="flex gap-1">
                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                       </div>
                     </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            
            <form onSubmit={handleChatSubmit} className="mt-auto pt-4 border-t border-gray-700 bg-surface">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-background border border-gray-700 rounded-xl pl-4 pr-12 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <button
              onClick={onCreateDocument}
              className="w-full py-3 px-4 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-400 hover:bg-gray-800/50 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>New Analysis Session</span>
            </button>

            <div className="space-y-2 mt-4">
              {documents.sort((a,b) => b.lastModified - a.lastModified).map((doc) => {
                const isActive = doc.id === activeDocId;
                const title = doc.text.trim().slice(0, 50) || "Untitled Document";
                const date = new Date(doc.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className={`
                      relative p-3 rounded-lg border cursor-pointer transition-all
                      ${isActive 
                        ? 'bg-blue-900/20 border-blue-500/50 shadow-sm' 
                        : 'bg-background/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-3 overflow-hidden">
                        <div className={`mt-1 p-1.5 rounded-md ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-sm font-medium truncate ${isActive ? 'text-blue-100' : 'text-gray-200'}`}>
                            {title}...
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {date}
                            </span>
                            <span>•</span>
                            <span>{doc.highlights.length} highlights</span>
                          </div>
                        </div>
                      </div>
                      
                      {documents.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDocument(doc.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};