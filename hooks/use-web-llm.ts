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

  // --- UPDATED: Accepts 'projectTitle' explicitly ---
  const generateProjectReadme = async (tree: string, dependencies: string, snippets: string, projectTitle: string) => {
    if (!engine.current) await initEngine();
    setStatus('generating');

    // We explicitly tell the AI the title so it doesn't hallucinate or repeat instructions
    const systemPrompt = `You are a Senior Software Architect. 
    Generate a COMPREHENSIVE README.md for the project titled "${projectTitle}".
    
    # Guidelines
    1. **Title**: Use "${projectTitle}" as the main H1 title.
    2. **Domain Analysis**: Analyze the 'Code Snippets' to write a specific Introduction (e.g., if you see 'MoodEntry', explain it's a Mood Tracker).
    3. **Tech Stack**: List languages/libs found in 'Dependencies'.
    
    # Required Output Structure:
    # ${projectTitle}
    ## 🚀 Introduction
    [Write 2-3 sentences about what the app does based on the code]

    ## ✨ Key Features
    [Bullet points derived from class names like 'AuthController' -> 'User Authentication']

    ## 🛠️ Tech Stack
    [List from dependencies]

    ## 📂 Project Structure
    [Briefly describe key folders]

    Do not include conversational filler. Output only Markdown.`;

    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `
          --- FILE STRUCTURE ---
          ${tree}
          
          --- DEPENDENCIES ---
          ${dependencies}
          
          --- CODE SNIPPETS (Logic Analysis) ---
          ${snippets}
          ` 
        }
      ];

      // @ts-ignore
      const res = await engine.current!.chat.completions.create({ messages: messages as any, temperature: 0.3 });
      setStatus('ready');
      return res.choices[0].message.content;
    } catch (err) {
      setStatus('ready');
      return "# Error\nFailed to generate project docs.";
    }
  };

  return { initEngine, generateDocs, generateProjectReadme, status, progress };
}