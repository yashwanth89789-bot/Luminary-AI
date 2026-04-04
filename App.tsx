import { useState, useRef, useEffect } from 'react';
import { 
  Wand2, 
  FileText, 
  Edit3, 
  Trash,
  X,
  Palette,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  LogIn,
  LogOut,
  FolderPlus,
  FolderOpen,
  Layers,
  MessageSquare,
  History as HistoryIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn, logout } from './src/firebase';
import { 
  analyzeTextWithGemini, 
  chatWithDocument, 
  analyzeImageWithGemini,
  chatWithKnowledgeBase 
} from './services/geminiService';
import { 
  createProject, 
  addDocumentToProject, 
  retrieveRelevantContext, 
  getProjects, 
  getProjectDocuments 
} from './services/ragService';
import { HighlightRenderer } from './components/HighlightRenderer';
import { RichTextEditor } from './components/RichTextEditor';
import { Sidebar } from './components/Sidebar';
import { MODES, INITIAL_TEXT, PALETTES } from './constants';
import { Highlight, HighlightCategory, ProcessingState, SavedDocument, ChatMessage, Project } from './types';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const createNewDoc = (initialText: string = ''): SavedDocument => ({
  id: generateId(),
  text: initialText,
  highlights: [],
  chatHistory: [],
  lastModified: Date.now()
});

// --- Landing Page Component ---
const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center relative overflow-hidden p-6">
    {/* Cinematic Background Effects */}
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10" 
    />
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 1 }}
      className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] -z-10" 
    />

    {/* Content */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-4xl w-full text-center space-y-8"
    >
      
      <div className="flex justify-center mb-8">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.05 }}
          className="bg-gradient-to-br from-blue-500 to-purple-600 p-5 rounded-2xl shadow-2xl shadow-blue-500/20"
        >
          <Wand2 className="w-16 h-16 text-white" />
        </motion.div>
      </div>

      <div className="space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-purple-200">
            D-Light
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
          Experience intelligent reading. Automatically highlight insights, facts, and action items with the power of AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto mt-16 mb-12">
        {[
          { 
            icon: <Sparkles className="w-6 h-6 text-purple-400" />, 
            title: "AI Analysis", 
            desc: "Instantly detect key points and core insights using Gemini models." 
          },
          { 
            icon: <Palette className="w-6 h-6 text-blue-400" />, 
            title: "Smart Categories", 
            desc: "Content is automatically sorted into facts, actions, and warnings." 
          },
          { 
            icon: <FileText className="w-6 h-6 text-emerald-400" />, 
            title: "Session History", 
            desc: "Your documents and highlights are saved locally for easy review." 
          },
        ].map((feature, idx) => (
          <motion.div 
            key={idx} 
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <div className="mb-4 bg-slate-800/50 w-fit p-3 rounded-lg">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 font-semibold text-lg text-white transition-all duration-300 bg-blue-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)]"
      >
        <span>Start Highlighting</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>
      
      <p className="text-xs text-slate-600 mt-12 font-mono">
        Powered by Google Gemini AI
      </p>
    </motion.div>
  </div>
);

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectDocuments, setProjectDocuments] = useState<any[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'insights' | 'chat' | 'history' | 'kb'>('editor');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadProjects();
      } else {
        setProjects([]);
        setActiveProjectId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadProjects = async () => {
    try {
      const projs = await getProjects();
      setProjects(projs);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const proj = await createProject(newProjectName);
      setProjects(prev => [...prev, proj]);
      setActiveProjectId(proj.id);
      setNewProjectName('');
      setIsCreatingProject(false);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  // Fetch project documents when active project changes
  useEffect(() => {
    if (activeProjectId) {
      loadProjectDocuments(activeProjectId);
    } else {
      setProjectDocuments([]);
    }
  }, [activeProjectId]);

  const loadProjectDocuments = async (projectId: string) => {
    try {
      const docs = await getProjectDocuments(projectId);
      setProjectDocuments(docs);
    } catch (err) {
      console.error("Failed to load project documents:", err);
    }
  };

  // Initialize history with one default document
  const [documents, setDocuments] = useState<SavedDocument[]>([
    createNewDoc(INITIAL_TEXT)
  ]);
  const [activeDocId, setActiveDocId] = useState<string>(documents[0].id);

  // Editor State (Synced with active document)
  const [text, setText] = useState<string>(documents[0].text);
  const [highlights, setHighlights] = useState<Highlight[]>(documents[0].highlights);
  const [summary, setSummary] = useState<string | undefined>(documents[0].summary);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(documents[0].chatHistory || []);
  
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [processing, setProcessing] = useState<ProcessingState>({ isAnalyzing: false, error: null });
  const [isChatLoading, setIsChatLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      setProcessing({ isAnalyzing: true, error: null });
      try {
        const result = await analyzeImageWithGemini(file.type, base64Data);
        setText(result.summary);
        setSummary(result.summary);
        
        // Map highlights to the summary text
        const newHighlights: Highlight[] = [];
        for (const res of result.highlights) {
          const index = result.summary.indexOf(res.quote, 0); 
          
          if (index !== -1) {
            const end = index + res.quote.length;
            newHighlights.push({
              id: generateId(),
              text: res.quote,
              category: res.category,
              startIndex: index,
              endIndex: end,
              note: res.explanation
            });
          }
        }
        setHighlights(newHighlights);
      } catch (err) {
        setProcessing({ isAnalyzing: false, error: "Failed to analyze image." });
      } finally {
        setProcessing(prev => ({ ...prev, isAnalyzing: false }));
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Selection State
  const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number } | null>(null);
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number; height: number } | null>(null);
  
  // Theme state
  const [currentTheme, setCurrentTheme] = useState<string>('Neon');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Ref to the text display container
  const displayRef = useRef<HTMLDivElement>(null);

  const activePalette = PALETTES[currentTheme];

  // --- Synchronization Logic ---
  
  // Update the document object in history whenever content changes
  useEffect(() => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => {
        if (doc.id === activeDocId) {
          // Only update if changes actually occurred
          if (doc.text !== text || doc.highlights !== highlights || doc.summary !== summary || doc.chatHistory !== chatHistory) {
            return {
              ...doc,
              text,
              highlights,
              summary,
              chatHistory,
              lastModified: Date.now()
            };
          }
        }
        return doc;
      })
    );
  }, [text, highlights, summary, chatHistory, activeDocId]);

  // Handle Document Switching
  const handleSwitchDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setActiveDocId(id);
      setText(doc.text);
      setHighlights(doc.highlights);
      setSummary(doc.summary);
      setChatHistory(doc.chatHistory || []);
      setIsEditMode(false); // Switch to view mode when changing docs
      setSelectedText(null);
    }
  };

  const handleCreateDocument = () => {
    const newDoc = createNewDoc('');
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setText(newDoc.text);
    setHighlights(newDoc.highlights);
    setSummary(undefined);
    setChatHistory([]);
    setIsEditMode(true); // Auto-enter edit mode for new doc
  };

  const handleDeleteDocument = (id: string) => {
    if (documents.length <= 1) return; // Prevent deleting last doc
    
    const newDocs = documents.filter(d => d.id !== id);
    setDocuments(newDocs);
    
    // If we deleted the active doc, switch to the first available one
    if (id === activeDocId) {
      const fallback = newDocs[0];
      setActiveDocId(fallback.id);
      setText(fallback.text);
      setHighlights(fallback.highlights);
      setSummary(fallback.summary);
      setChatHistory(fallback.chatHistory || []);
    }
  };

  // --- Core Features ---

  const handleSaveToProject = async () => {
    if (!activeProjectId || !text.trim()) return;
    setProcessing({ isAnalyzing: true, error: null });
    try {
      const title = text.split('\n')[0].replace(/<[^>]*>?/gm, '').slice(0, 50) || "Untitled Document";
      await addDocumentToProject(activeProjectId, title, text);
      // Refresh project documents
      loadProjectDocuments(activeProjectId);
    } catch (err) {
      setProcessing({ isAnalyzing: false, error: "Failed to save to project." });
    } finally {
      setProcessing(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleAIAnalyze = async () => {
    const plainText = text.replace(/<[^>]*>?/gm, '');
    if (!plainText.trim()) return;
    
    setProcessing({ isAnalyzing: true, error: null });
    setIsEditMode(false); 

    try {
      setHighlights([]); 
      setSummary(undefined);

      const result = await analyzeTextWithGemini(plainText);
      
      const newHighlights: Highlight[] = [];

      for (const res of result.highlights) {
        const index = text.indexOf(res.quote, 0); 
        
        if (index !== -1) {
          const end = index + res.quote.length;
          const hasOverlap = newHighlights.some(h => 
            (index >= h.startIndex && index < h.endIndex) || 
            (end > h.startIndex && end <= h.endIndex)
          );

          if (!hasOverlap) {
            newHighlights.push({
              id: generateId(),
              text: res.quote,
              category: res.category,
              startIndex: index,
              endIndex: end
            });
          }
        }
      }

      setHighlights(prev => [...prev, ...newHighlights]);
      setSummary(result.summary);
    } catch (err) {
      setProcessing({ isAnalyzing: false, error: "Failed to analyze text. Please check your API key or try again." });
    } finally {
      setProcessing(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleChatSend = async (userMessage: string) => {
    const plainText = text.replace(/<[^>]*>?/gm, '');
    if (!plainText.trim()) return;
    
    const newUserMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: userMessage,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);

    try {
      let aiResponseText = "";
      
      if (activeProjectId) {
        // RAG Mode: Retrieve context from all documents in project
        const context = await retrieveRelevantContext(activeProjectId, userMessage);
        aiResponseText = await chatWithKnowledgeBase(context, userMessage, [...chatHistory, newUserMsg]);
      } else {
        // Single Document Mode
        aiResponseText = await chatWithDocument(plainText, userMessage, [...chatHistory, newUserMsg]);
      }
      
      const newAiMsg: ChatMessage = {
        id: generateId(),
        role: 'ai',
        text: aiResponseText,
        timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, newAiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleManualHighlight = (category: HighlightCategory) => {
    if (!selectedText) return;

    const newHighlight: Highlight = {
      id: generateId(),
      text: selectedText.text,
      category: category,
      startIndex: selectedText.start,
      endIndex: selectedText.end
    };

    // Remove overlaps
    const filteredHighlights = highlights.filter(h => 
      !((newHighlight.startIndex >= h.startIndex && newHighlight.startIndex < h.endIndex) || 
        (newHighlight.endIndex > h.startIndex && newHighlight.endIndex <= h.endIndex) ||
        (newHighlight.startIndex <= h.startIndex && newHighlight.endIndex >= h.endIndex))
    );

    setHighlights([...filteredHighlights, newHighlight]);
    setSelectedText(null);
    setSelectionPos(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectedText(null);
      setSelectionPos(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedStr = range.toString();

    // Check if valid selection inside our display area
    if (displayRef.current && displayRef.current.contains(range.commonAncestorContainer)) {
      const idx = text.indexOf(selectedStr);
      
      if (idx !== -1) {
         // Get screen coordinates for the toolbar
         const rect = range.getBoundingClientRect();
         setSelectionPos({
           top: rect.top,
           left: rect.left + (rect.width / 2),
           height: rect.height
         });

         setSelectedText({
           text: selectedStr,
           start: idx, 
           end: idx + selectedStr.length
         });
      }
    }
  };

  const handleScroll = () => {
    // Dismiss toolbar on scroll to avoid detached floating elements
    if (selectedText) {
      setSelectedText(null);
      setSelectionPos(null);
    }
  };

  const deleteHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  const clearAllHighlights = () => {
    if (confirm("Clear all highlights for this document?")) {
      setHighlights([]);
      setSummary(undefined);
    }
  };

  const scrollToHighlight = (id: string) => {
    setIsEditMode(false);
    
    setTimeout(() => {
      const element = document.getElementById(`highlight-${id}`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        element.classList.add('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-gray-900');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-gray-900');
        }, 2000);
      }
    }, 100);
  };

  // Determine toolbar position (Above or Below) based on screen space
  const getToolbarStyle = () => {
    if (!selectionPos) return {};
    
    // Header height is roughly 64px + Toolbar 56px + Padding = ~130px safe zone
    const isCloseToTop = selectionPos.top < 130;
    
    if (isCloseToTop) {
      // Position BELOW selection
      return {
        top: selectionPos.top + selectionPos.height + 10,
        left: selectionPos.left,
        transform: 'translateX(-50%)'
      };
    } else {
      // Position ABOVE selection (Default)
      return {
        top: selectionPos.top - 10,
        left: selectionPos.left,
        transform: 'translate(-50%, -100%)'
      };
    }
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-slate-100 animate-in fade-in duration-500">
      {/* Header */}
      <header className="h-16 border-b border-gray-700 bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Wand2 className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
            D-Light
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Project Selector */}
          {user && (
            <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
              <select 
                value={activeProjectId || ''} 
                onChange={(e) => setActiveProjectId(e.target.value || null)}
                className="bg-transparent text-sm text-gray-300 px-2 py-1 outline-none cursor-pointer"
              >
                <option value="">No Project (Single Doc)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsCreatingProject(true)}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                title="Create New Project"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-700" />
              <button 
                onClick={logout}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={signIn}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            title="Upload Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              title="Change Color Theme"
            >
              <Palette className="w-5 h-5" />
            </button>

            {showThemeMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-2 space-y-1">
                  {Object.keys(PALETTES).map(theme => (
                    <button
                      key={theme}
                      onClick={() => {
                        setCurrentTheme(theme);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        currentTheme === theme ? 'bg-blue-600/20 text-blue-200' : 'text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      {theme}
                      {currentTheme === theme && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Project Creation Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <p className="text-sm text-gray-400 mb-6">
              A project acts as a Knowledge Base. All documents added to this project will be searchable in the chat.
            </p>
            <input 
              type="text" 
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCreatingProject(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        
        {/* Editor Area */}
        <main className={`flex-1 flex flex-col min-w-0 relative ${activeMobileTab !== 'editor' ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Toolbar */}
          <div className="h-14 border-b border-gray-700 bg-surface/30 flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg">
                 <button
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isEditMode ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Edit3 className="w-4 h-4" /> <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${!isEditMode ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <FileText className="w-4 h-4" /> <span className="hidden sm:inline">View</span>
                </button>
              </div>

              <button 
                onClick={() => {
                  setIsEditMode(false);
                  handleAIAnalyze();
                }}
                disabled={processing.isAnalyzing || !text.trim()}
                className={`
                  hidden md:flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg font-medium text-sm transition-all
                  ${processing.isAnalyzing 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-blue-50 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                  }
                `}
              >
                {processing.isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span className="hidden xs:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon /> <span className="xs:inline">Analyze</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
               {activeProjectId && (
                 <button 
                  onClick={handleSaveToProject}
                  disabled={processing.isAnalyzing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors"
                  title="Save to Knowledge Base"
                >
                  <FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Index to KB</span>
                </button>
               )}
               {highlights.length > 0 && (
                <button 
                  onClick={clearAllHighlights}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                  title="Clear all highlights"
                >
                  <Trash className="w-4 h-4" />
                </button>
               )}
            </div>
          </div>

          {/* Error Banner */}
          {processing.error && (
            <div className="bg-rose-500/10 border-l-4 border-rose-500 p-4 mx-6 mt-6 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-rose-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-rose-300">{processing.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Text Area */}
          <div 
            className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth" 
            id="editor-scroll-container"
            onScroll={handleScroll}
          >
            <div className="max-w-3xl mx-auto min-h-[500px] pb-20">
              {/* Mobile Floating Action Button for AI Analyze */}
              <div className="fixed bottom-24 right-6 z-40 md:hidden">
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    handleAIAnalyze();
                  }}
                  disabled={processing.isAnalyzing || !text.trim()}
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95
                    ${processing.isAnalyzing 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-blue-50 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                    }
                  `}
                >
                  {processing.isAnalyzing ? (
                    <div className="w-6 h-6 border-3 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <SparklesIcon />
                  )}
                </button>
              </div>

              {isEditMode ? (
                <RichTextEditor
                  content={text}
                  onChange={setText}
                  editable={isEditMode}
                />
              ) : (
                <div 
                  ref={displayRef}
                  onMouseUp={handleTextSelection}
                  className="relative"
                >
                  <HighlightRenderer 
                    text={text} 
                    highlights={highlights} 
                    palette={activePalette}
                    onHighlightClick={scrollToHighlight}
                  />
                  
                  {/* Floating Action for Manual Selection */}
                  {selectedText && selectionPos && (
                    <div 
                      className="fixed z-50 flex gap-1 p-2 border border-gray-600 shadow-2xl bg-surface rounded-xl animate-in fade-in zoom-in-95 duration-200"
                      style={getToolbarStyle()}
                    >
                       {Object.values(MODES).map((mode) => {
                         const colors = activePalette[mode.id];
                         return (
                           <button
                              key={mode.id}
                              onClick={() => handleManualHighlight(mode.id)}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors group relative"
                              title={mode.label}
                           >
                              <div className={`${colors.color} transition-transform group-hover:scale-110`}>
                                {mode.icon}
                              </div>
                           </button>
                         );
                       })}
                       <div className="w-px bg-gray-700 mx-1"></div>
                       <button
                          onClick={() => {
                            setSelectedText(null);
                            setSelectionPos(null);
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <div className={`${activeMobileTab === 'editor' ? 'hidden md:block' : 'block'} h-full flex-1 md:flex-none`}>
           <Sidebar 
              highlights={highlights} 
              summary={summary}
              chatHistory={chatHistory}
              palette={activePalette}
              onDeleteHighlight={deleteHighlight}
              onJumpToHighlight={(id) => {
                scrollToHighlight(id);
                setActiveMobileTab('editor');
              }}
              onSendChatMessage={handleChatSend}
              isChatLoading={isChatLoading}
              documents={documents}
              activeDocId={activeDocId}
              onSelectDocument={(id) => {
                handleSwitchDocument(id);
                setActiveMobileTab('editor');
              }}
              onDeleteDocument={handleDeleteDocument}
              onCreateDocument={() => {
                handleCreateDocument();
                setActiveMobileTab('editor');
              }}
              activeProjectId={activeProjectId}
              projectDocuments={projectDocuments}
              initialTab={activeMobileTab === 'editor' ? 'highlights' : (activeMobileTab === 'insights' ? 'highlights' : (activeMobileTab === 'chat' ? 'chat' : (activeMobileTab === 'history' ? 'history' : 'kb')))}
           />
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden h-16 border-t border-gray-700 bg-surface flex items-center justify-around px-2 shrink-0 z-50">
        <button 
          onClick={() => setActiveMobileTab('editor')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeMobileTab === 'editor' ? 'text-blue-400' : 'text-gray-500'}`}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Editor</span>
        </button>
        <button 
          onClick={() => setActiveMobileTab('insights')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeMobileTab === 'insights' ? 'text-blue-400' : 'text-gray-500'}`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium">Insights</span>
        </button>
        <button 
          onClick={() => setActiveMobileTab('chat')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeMobileTab === 'chat' ? 'text-blue-400' : 'text-gray-500'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Ask AI</span>
        </button>
        <button 
          onClick={() => setActiveMobileTab('history')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeMobileTab === 'history' ? 'text-blue-400' : 'text-gray-500'}`}
        >
          <HistoryIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </button>
        {activeProjectId && (
          <button 
            onClick={() => setActiveMobileTab('kb')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeMobileTab === 'kb' ? 'text-blue-400' : 'text-gray-500'}`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">KB</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Icon helper
function SparklesIcon() {
  return (
    <svg 
      className="w-4 h-4 animate-pulse" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" fill="currentColor"/>
    </svg>
  );
}