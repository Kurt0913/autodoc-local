import { FileNode } from '../lib/file-system';
import { X, Bot, Sparkles, Download, Check, Copy, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion'; // <--- IMPORT THIS

interface InspectorPanelProps {
  selectedFile: FileNode | null;
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  aiOutput: string;
}

const DocSkeleton = () => (
  <div className="animate-pulse space-y-6 mt-4 opacity-50">
    <div className="h-8 bg-slate-700/50 rounded w-3/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-700/50 rounded"></div>
      <div className="h-4 bg-slate-700/50 rounded"></div>
      <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
    </div>
    <div className="h-32 bg-slate-800/50 rounded-lg border border-slate-700/50"></div>
  </div>
);

export default function InspectorPanel({ 
  selectedFile, 
  onClose, 
  onGenerate,
  isGenerating,
  aiOutput 
}: InspectorPanelProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDownloaded(false);
    setCopied(false);
  }, [selectedFile]);

  // Handle Copy/Download functions (same as before)...
  const handleDownload = () => {
    if (!aiOutput) return;
    const blob = new Blob([aiOutput], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile?.name.endsWith('.md') ? selectedFile.name : `${selectedFile?.name}_README.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleCopy = async () => {
    if (!aiOutput) return;
    try {
      await navigator.clipboard.writeText(aiOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <AnimatePresence>
      {selectedFile && (
        <motion.div 
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 right-4 bottom-4 w-[600px] bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden ring-1 ring-black/50 z-50"
        >
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2 bg-blue-500/20 rounded-lg text-blue-400"
              >
                <FileText className="w-5 h-5" />
              </motion.div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">File Inspector</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[300px]" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGenerate}
              disabled={isGenerating}
              className="group w-full py-4 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-8 border border-white/10"
            >
              {isGenerating ? (
                <span className="animate-pulse flex items-center gap-2">
                  Analyzing...
                </span>
              ) : (
                <>
                  <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {selectedFile.path === 'root-project-readme' ? 'Generate Root README' : 'Generate Docs'}
                </>
              )}
            </motion.button>

            {/* Output Area with AnimatePresence for smooth mounting */}
            <AnimatePresence mode='wait'>
              {(aiOutput || isGenerating) && (
                <motion.div 
                  key="output-box"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Analysis Result
                    </div>
                    
                    {aiOutput && !aiOutput.startsWith('⬇️') && !isGenerating && (
                      <div className="flex gap-1">
                         <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleCopy} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleDownload} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white">
                            {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                          </motion.button>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0b0f19] rounded-xl border border-white/5 p-6 shadow-inner min-h-[300px]">
                    {isGenerating ? (
                      <DocSkeleton />
                    ) : aiOutput ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white mb-4 pb-2 border-b border-white/10" {...props} />,
                            code({node, inline, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className="my-4 rounded-lg overflow-hidden border border-white/5 shadow-2xl">
                                   <div className="bg-[#1e2433] px-3 py-1 text-xs text-slate-400 border-b border-white/5 font-mono">{match[1]}</div>
                                   <SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, background: '#151b2b' }} {...props}>
                                     {String(children).replace(/\n$/, '')}
                                   </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono border border-blue-500/20" {...props}>
                                  {children}
                                </code>
                              )
                            }
                          }}
                        >
                          {aiOutput}
                        </ReactMarkdown>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}