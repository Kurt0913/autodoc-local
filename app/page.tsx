"use client"; 

import { useState } from 'react';
import { readDirectory, FileNode } from '../lib/file-system'; 
import FileGraph from '../components/FileGraph';               
import { FolderOpen, FileCode, Loader2, Sparkles, Terminal } from 'lucide-react'; 
import InspectorPanel from '../components/InspectorPanel';
import { useWebLLM } from '../hooks/use-web-llm'; 
import { motion } from 'framer-motion'; 

export default function Home() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [aiOutput, setAiOutput] = useState("");
  const [projectName, setProjectName] = useState("My Project");

  const { generateDocs, generateProjectReadme, status, progress } = useWebLLM(); 

  // --- Helpers ---
  const getFileTreeString = (nodes: FileNode[], depth = 0): string => {
    let output = "";
    const indent = "  ".repeat(depth);
    for (const node of nodes) {
      if (depth > 4) return output; 
      output += `${indent}- ${node.name} (${node.kind})\n`;
      if (node.children) output += getFileTreeString(node.children, depth + 1);
    }
    return output;
  };

  const findDependencyFile = (nodes: FileNode[]): string => {
    const rootPkg = nodes.find(n => n.name === 'package.json' || n.name === 'pom.xml');
    if (rootPkg && rootPkg.content) return `Filename: ${rootPkg.name}\nContent:\n${rootPkg.content}`;
    const recursiveSearch = (list: FileNode[]): string | null => {
        for (const node of list) {
            if ((node.name === 'package.json' || node.name === 'pom.xml') && node.content) return `Filename: ${node.name}\nContent:\n${node.content}`;
            if (node.children) {
                const found = recursiveSearch(node.children);
                if (found) return found;
            }
        }
        return null;
    };
    return recursiveSearch(nodes) || "No dependency file found.";
  };

  const getKeyFileSnippets = (nodes: FileNode[]): string => {
    let snippets = "";
    const IGNORE = ['test', 'spec', 'config', 'setup', 'd.ts', 'min.js', 'node_modules', 'dist', 'build', '.git'];
    function scan(list: FileNode[]) {
      for (const node of list) {
        if (node.kind === 'file' && node.content) {
          const lowerName = node.name.toLowerCase();
          if (IGNORE.some(p => lowerName.includes(p))) continue;
          const isModelOrClass = /^[A-Z][a-zA-Z0-9]{2,}\.(java|ts|tsx|py|cs|jsx)$/.test(node.name);
          const isCore = ['App', 'Server', 'Routes', 'Main', 'Controller', 'Service'].some(n => node.name.includes(n));
          if (isModelOrClass || isCore) snippets += `\n--- File: ${node.name} ---\n${node.content.slice(0, 1000)}\n...\n`;
        }
        if (node.children) scan(node.children);
      }
    }
    scan(nodes);
    return snippets.slice(0, 10000); 
  };

  async function handleOpenFolder() {
    try {
      setSelectedFile(null);
      setAiOutput("");
      // @ts-ignore 
      const dirHandle = await window.showDirectoryPicker();
      setProjectName(dirHandle.name || "Project Documentation");
      setLoading(true);
      const fileTree = await readDirectory(dirHandle);
      setFiles(fileTree);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateProjectDocs = async () => {
    const treeString = getFileTreeString(files);
    const dependencies = findDependencyFile(files);
    const keySnippets = getKeyFileSnippets(files);
    
    const safeName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const dynamicFilename = `${safeName}_README.md`;

    const fakeRootNode: FileNode = {
      name: dynamicFilename,
      kind: "file",
      path: "root-project-readme",
      content: " Generating comprehensive documentation..." 
    };
    setSelectedFile(fakeRootNode);

    const result = await generateProjectReadme(treeString, dependencies, keySnippets, projectName);
    if (result) setAiOutput(result.replace(/^Here is.*?:\n/i, '').trim());
  };

  const handleSingleFileDocs = async () => {
    if (!selectedFile || !selectedFile.content) return;
    const result = await generateDocs(selectedFile.content, selectedFile.name);
    if (result) setAiOutput(result);
  };

  const isBusy = status === 'loading' || status === 'generating';

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#050505] text-slate-200 relative overflow-hidden selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="max-w-6xl w-full text-center space-y-10 z-10 pt-20 px-6 pb-20"> 
        
        {/* Animated Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-white/10 text-xs font-medium text-slate-400 mb-4">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span>AI-Powered Local Documentation</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white">
            AutoDoc <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Local</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Instant, private code documentation. <br/>
            Your code runs in your browser. Zero data leaves your machine.
          </p>
        </motion.div>

        {/* Animated Buttons */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap gap-4 justify-center items-center"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenFolder}
            disabled={loading}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white transition-all duration-300 
            bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-xl 
            hover:bg-slate-700/50 hover:border-white/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] 
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FolderOpen className="w-5 h-5 mr-2 text-blue-400" />}
            {loading ? 'Scanning...' : 'Open Project'}
          </motion.button>

          {files.length > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateProjectDocs}
              disabled={isBusy}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white transition-all duration-300 
              bg-[#0A0A0A] border border-emerald-500/20 rounded-xl 
              hover:bg-[#111] hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] 
              disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Terminal className="w-5 h-5 mr-2 text-emerald-400" />}
              Generate Root README
            </motion.button>
          )}
        </motion.div>

        {/* Animated Graph Container */}
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            className="w-full mt-12 relative group"
          >
             
             <div className="rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden">
                
                {/* Window Toolbar */}
                <div className="h-12 border-b border-white/5 bg-[#111] flex items-center justify-between px-4">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10"></div>
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10"></div>
                   </div>
                   <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                      <FileCode className="w-3 h-3" />
                      {projectName}
                   </div>
                   <div className="w-12"></div> 
                </div>

                <div className="relative">
                  <FileGraph 
                    files={files} 
                    onNodeClick={(file) => {
                      setSelectedFile(file);
                      setAiOutput("");
                    }} 
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none"></div>
                </div>
             </div>
             
             <div className="mt-6 text-center">
                 <p className="text-sm text-slate-600 font-mono">
                    Select a node to inspect • Drag to pan
                 </p>
             </div>
          </motion.div>
        )}

        <InspectorPanel 
          selectedFile={selectedFile}
          onClose={() => setSelectedFile(null)}
          onGenerate={selectedFile?.path === "root-project-readme" ? handleGenerateProjectDocs : handleSingleFileDocs}
          isGenerating={isBusy}
          aiOutput={status === 'loading' ? `⬇️ ${progress}` : aiOutput}
        />

        {/* --- NEW FOOTER --- */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-slate-600 text-sm font-mono flex items-center justify-center gap-2"
        >
           <span>© 2026</span>
           <span className="text-blue-500 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
             Kurt Tendero
           </span>
        </motion.div>

      </div>
    </main>
  );
}