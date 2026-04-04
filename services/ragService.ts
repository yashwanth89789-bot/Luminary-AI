import { 
  collection, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { generateEmbeddings } from './geminiService';
import { Project, Document, Chunk } from '../types';

// Simple cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const createProject = async (name: string, description?: string): Promise<Project> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const projectRef = doc(collection(db, 'projects'));
  const project: Project = {
    id: projectRef.id,
    name,
    description,
    ownerId: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(projectRef, {
    ...project,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return project;
};

export const addDocumentToProject = async (
  projectId: string, 
  title: string, 
  content: string
): Promise<Document> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const docRef = doc(collection(db, `projects/${projectId}/documents`));
  const document: Document = {
    id: docRef.id,
    projectId,
    title,
    content,
    ownerId: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(docRef, {
    ...document,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Chunk and embed
  await processDocumentChunks(document);

  return document;
};

const processDocumentChunks = async (document: Document) => {
  const user = auth.currentUser;
  if (!user) return;

  // Simple chunking strategy: split by paragraphs or fixed length
  const chunks = document.content.split(/\n\n+/).filter(c => c.trim().length > 0);
  
  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i];
    const embedding = await generateEmbeddings(text);
    
    const chunkRef = doc(collection(db, `projects/${document.projectId}/chunks`));
    const chunk: Chunk = {
      id: chunkRef.id,
      documentId: document.id,
      projectId: document.projectId,
      text,
      embedding,
      ownerId: user.uid,
      chunkIndex: i
    };

    await setDoc(chunkRef, chunk);
  }
};

export const retrieveRelevantContext = async (
  projectId: string, 
  queryText: string, 
  limit: number = 5
): Promise<string> => {
  const queryEmbedding = await generateEmbeddings(queryText);
  
  // Fetch all chunks for the project (in a real app, use vector search)
  const chunksSnap = await getDocs(collection(db, `projects/${projectId}/chunks`));
  const chunks = chunksSnap.docs.map(d => d.data() as Chunk);

  // Calculate similarities
  const scoredChunks = chunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Sort and take top N
  const topChunks = scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return topChunks.map(c => c.chunk.text).join('\n\n---\n\n');
};

export const getProjects = async (): Promise<Project[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Project);
};

export const getProjectDocuments = async (projectId: string): Promise<Document[]> => {
  const snap = await getDocs(collection(db, `projects/${projectId}/documents`));
  return snap.docs.map(d => d.data() as Document);
};
