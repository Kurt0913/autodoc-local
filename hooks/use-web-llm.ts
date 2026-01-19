import { useState, useRef } from 'react';
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";

const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export function useWebLLM() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'generating'>('idle');
  const [progress, setProgress] = useState<string>("");
  const engine = useRef<MLCEngine | null>(null);

  const initEngine = async () => {
    if (engine.current) return; 
    setStatus('loading');
    try {
      engine.current = await CreateMLCEngine(SELECTED_MODEL, {
        initProgressCallback: (report) => {
          setProgress(report.text.replace(/\[.*?\]/, '').trim()); 
        },
      });
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  const generateDocs = async (code: string, filename: string) => {
    if (!engine.current) await initEngine();
    setStatus('generating');
    
    const systemPrompt = `You are a technical documentation expert. Write a detailed README section for this file.`;
    
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Filename: ${filename}\nCode:\n${code.slice(0, 10000)}` } 
      ];
      // @ts-ignore
      const res = await engine.current!.chat.completions.create({ messages: messages as any, temperature: 0.3 });
      setStatus('ready');
      return res.choices[0].message.content;
    } catch (err) {
      setStatus('ready');
      return "# Error\nFailed.";
    }
  };

  const generateProjectReadme = async (tree: string, dependencies: string, snippets: string, projectTitle: string) => {
    if (!engine.current) await initEngine();
    setStatus('generating');

    // --- REFINED PROMPT ---
    const systemPrompt = `You are an expert Technical Writer and Software Architect.
    
    Your task is to write a PROFESSIONAL GITHUB README.md for the project "${projectTitle}".
    
    ### STRICT RULES:
    1. **DO NOT** copy or output the raw code provided in the context.
    2. **DO NOT** write "Here is the code".
    3. **DO** analyze the logic to write *descriptions* of what the code does.
    4. **DO** use proper Markdown formatting (H1, H2, Bold, Code Blocks for bash commands only).
    
    ### README STRUCTURE (Follow this exactly):
    
    # ${projectTitle}
    
    ## 📖 Introduction
    [Write a professional 3-4 sentence summary of what this application does, based on the file names and logic found.]
    
    ## ✨ Key Features
    [Bullet points describing specific capabilities found in the code (e.g., "Real-time graph visualization", "In-browser AI inference").]
    
    ## 🛠️ Tech Stack
    [List the main frameworks/libraries found in the dependencies (e.g., Next.js, React, Tailwind, Framer Motion).]
    
    ## 🚀 Getting Started
    
    ### Prerequisites
    - Node.js (v18+)
    
    ### Installation
    \`\`\`bash
    git clone https://github.com/yourusername/${projectTitle.toLowerCase().replace(/\s+/g, '-')}.git
    cd ${projectTitle.toLowerCase().replace(/\s+/g, '-')}
    npm install
    npm run dev
    \`\`\`
    
    ## 📂 Project Structure
    [Briefly explain the purpose of key folders like 'components', 'hooks', or 'lib' based on the file tree provided.]
    
    ---
    
    *Generated with AutoDoc Local*
    `;

    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `
          Analyze this project context to write the README.
          
          --- FILE TREE ---
          ${tree}
          
          --- PACKAGE.JSON / DEPENDENCIES ---
          ${dependencies}
          
          --- KEY CODE SNIPPETS (For Analysis Only - DO NOT COPY) ---
          ${snippets}
          ` 
        }
      ];

      // @ts-ignore
      const res = await engine.current!.chat.completions.create({ messages: messages as any, temperature: 0.2 }); // Lower temperature = more obedient
      setStatus('ready');
      return res.choices[0].message.content;
    } catch (err) {
      setStatus('ready');
      return "# Error\nFailed to generate project docs.";
    }
  };

  return { initEngine, generateDocs, generateProjectReadme, status, progress };
}