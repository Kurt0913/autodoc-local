// src/lib/file-system.ts

// 1. Define what our file structure looks like
export type FileNode = {
  name: string;
  kind: 'file' | 'directory';
  path: string;
  content?: string;      // We only read text files
  children?: FileNode[]; // Only folders have children
};

// 2. Junk we want to ignore immediately to prevent crashing
const IGNORE_LIST = [
  'node_modules', 
  '.git', 
  '.next', 
  'dist', 
  'build', 
  'package-lock.json',
  'yarn.lock',
  '.DS_Store'
];

export async function readDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path = ''
): Promise<FileNode[]> {
  const files: FileNode[] = [];

  // Iterate through every entry in the folder
  for await (const [name, handle] of directoryHandle.entries()) {
    
    // Skip ignored files/folders
    if (IGNORE_LIST.includes(name) || name.startsWith('.')) {
      continue;
    }

    const currentPath = `${path}/${name}`;

    if (handle.kind === 'file') {
      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();

      // Only read text files (code), skip images/binaries
      if (file.type.startsWith('image') || file.type.startsWith('audio') || file.type.startsWith('video')) {
         continue;
      }

      // Read the content
      const text = await file.text();

      files.push({
        name,
        kind: 'file',
        path: currentPath,
        content: text.slice(0, 100000) // Limit size to avoid memory crash
      });

    } else if (handle.kind === 'directory') {
      const dirHandle = handle as FileSystemDirectoryHandle;
      
      // Recursively read this sub-folder
      const children = await readDirectory(dirHandle, currentPath);

      files.push({
        name,
        kind: 'directory',
        path: currentPath,
        children
      });
    }
  }

  return files;
}