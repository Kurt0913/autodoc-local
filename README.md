# AutoDoc Local

![AutoDoc Local Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

**Instant, private code documentation.** *Your code runs in your browser—zero data leaves your machine.*

## 📖 Introduction

**AutoDoc Local** is a privacy-first developer tool that generates comprehensive documentation for your codebases without ever sending source code to the cloud. 

By leveraging **WebLLM**, it runs powerful Large Language Models (LLMs) directly inside your browser. It scans your local directory, visualizes your project structure as an interactive graph, and creates professional `README.md` files or detailed logic breakdowns for individual files—all locally.

## ✨ Key Features

* **🔒 Zero Privacy Risk:** No API keys required. No cloud uploads. Your code never leaves your device.
* **🧠 In-Browser AI:** Powered by WebLLM to run models like Llama-3 directly in Chrome/Edge.
* **🗺️ Interactive Visualization:** Visualizes your file structure with a dynamic node graph using React Flow.
* **🎨 Premium UI:** Features a modern "Glassmorphism" dark mode aesthetic with smooth Framer Motion animations.
* **⚡ Smart Context:** Automatically detects dependencies and tech stacks to generate accurate documentation.
* **📄 Export Options:** One-click copy to clipboard or download documentation as `.md` files.

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **AI Engine:** [WebLLM](https://webllm.mlc.ai/) (Local LLM Inference)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)
* **Visualization:** [React Flow](https://reactflow.dev/) & Dagre
* **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

* **Node.js** (v18 or higher recommended)
* A modern browser with WebGPU support (Chrome 113+, Edge 113+)

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/autodoc-local.git](https://github.com/yourusername/autodoc-local.git)
    cd autodoc-local
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Open the app**
    Navigate to `http://localhost:3000` in your browser.

## 📖 Usage Guide

1.  **Open Project:** Click the "Open Project" button and select any folder on your computer.
2.  **Wait for Scan:** The app will map your directory and build a dependency graph.
3.  **Generate Docs:**
    * **Root README:** Click "Generate Root README" to create a full project overview.
    * **Single File:** Click any node in the graph, then click "Generate Docs" in the inspector panel to document that specific file.
4.  **Export:** Use the Copy or Download buttons in the inspector panel to save your new documentation.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Designed & Built by <a href="https://github.com/Kurt0913">Kurt Tendero</a></sub>
</div>
