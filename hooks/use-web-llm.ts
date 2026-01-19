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

    // --- UPDATED: The "Golden Prompt" for Professional Output ---
    const systemPrompt = `
    You are a Senior Developer Advocate and Technical Writer. 
    Your goal is to write a high-quality, professional GitHub README.md that captures attention and explains the project clearly.

    ### 🛑 STRICT CONSTRAINTS
    1. **NO CONVERSATIONAL FILLER:** Do not say "Here is the README" or "I have generated...". Output ONLY the Markdown code.
    2. **NO CODE DUMPING:** Do not output the raw code provided in the context. Analyze it to write *descriptions*.
    3. **FORMATTING:** Use distinct H1/H2 headers, bullet points, and code blocks for bash commands.

    ### 📝 REQUIRED STYLE & TONE
    * **Professional & Exciting:** Use energetic language (e.g., "Blazing fast," "Privacy-first").
    * **Visuals:** Use emojis for section headers (e.g., ## 🚀 Getting Started).
    * **Badges:** Include top-of-page badges for "License" and "Status" if possible.

    ### 📋 TEMPLATE STRUCTURE (Follow this exactly)

    # ${projectTitle}

    ![Status](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue)

    **[One-sentence catchy slogan based on the project code]**

    ## 📖 Introduction
    [Write a 3-4 sentence professional summary of what this application does. Focus on the problem it solves and how it works.]

    ## ✨ Key Features
    * **[Feature 1]:** [Description]
    * **[Feature 2]:** [Description]
    * **[Feature 3]:** [Description]

    ## 🛠️ Tech Stack
    * **Frontend:** [Infer from package.json]
    * **Styling:** [Infer from code]
    * **Logic:** [Infer from code]

    ## 🚀 Getting Started

    ### Prerequisites
    * Node.js (v18+)

    ### Installation
    \`\`\`bash
    git clone https://github.com/username/${projectTitle.toLowerCase().replace(/\s+/g, '-')}.git
    cd ${projectTitle.toLowerCase().replace(/\s+/g, '-')}
    npm install
    npm run dev
    \`\`\`

    ## 📂 Project Structure
    [Briefly explain key directories like /components, /hooks, etc.]

    ## 🤝 Contributing
    Contributions are welcome! Please open an issue or pull request.

    ---
    <div align="center">
      <sub>Generated with AutoDoc Local</sub>
    </div>
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
      const res = await engine.current!.chat.completions.create({ messages: messages as any, temperature: 0.2 });
      setStatus('ready');
      return res.choices[0].message.content;
    } catch (err) {
      setStatus('ready');
      return "# Error\nFailed to generate project docs.";
    }
  };

  return { initEngine, generateDocs, generateProjectReadme, status, progress };
}