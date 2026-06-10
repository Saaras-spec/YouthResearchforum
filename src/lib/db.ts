import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const DEFAULT_PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmNWY1ZjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNzM3MzczIj5Zb3V0aCBSZXNlYXJjaCBGb3J1bTwvdGV4dD48L3N2Zz4=";

// Interfaces
export interface Article {
  id?: string;
  title: string;
  subtitle: string;
  excerpt?: string;
  content: string;
  authorName: string;
  authorBio: string;
  section: "national" | "international";
  category: string;
  coverImage: string;
  createdAt: any;
  readingTime: number; // in minutes
  featured: boolean;
  slug: string;
}

export interface Comment {
  id?: string;
  articleId: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  createdAt: any;
}

export interface NewsletterSubscriber {
  email: string;
  subscriptionType: "daily" | "weekly";
  subscribedAt: any;
}

// Slug helper
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

// ARTICLES CRUD HELPERS

// Get all articles ordered by date
export async function getArticles(limitCount?: number): Promise<Article[]> {
  try {
    const articlesRef = collection(db, "articles");
    const q = limitCount
      ? query(articlesRef, orderBy("createdAt", "desc"), limit(limitCount))
      : query(articlesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const articles: Article[] = [];
    querySnapshot.forEach((docSnap) => {
      articles.push({ id: docSnap.id, ...docSnap.data() } as Article);
    });
    return articles;
  } catch (error) {
    console.error("Error in getArticles:", error);
    return [];
  }
}

// Get article by slug
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("slug", "==", slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Article;
  } catch (error) {
    console.error("Error in getArticleBySlug:", error);
    return null;
  }
}

// Get featured article
export async function getFeaturedArticle(): Promise<Article | null> {
  try {
    const articlesRef = collection(db, "articles");
    // Query featured = true only (avoids needing composite index with orderBy)
    const q = query(articlesRef, where("featured", "==", true));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const articles: Article[] = [];
      querySnapshot.forEach((docSnap) => {
        articles.push({ id: docSnap.id, ...docSnap.data() } as Article);
      });
      // Sort in-memory by createdAt descending
      articles.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      return articles[0];
    }
    
    // Fallback: get the latest article
    const latestArticles = await getArticles(1);
    return latestArticles.length > 0 ? latestArticles[0] : null;
  } catch (error) {
    console.error("Error in getFeaturedArticle:", error);
    return null;
  }
}

// Get articles by section (national vs international)
export async function getArticlesBySection(
  section: "national" | "international",
  limitCount?: number
): Promise<Article[]> {
  try {
    const articlesRef = collection(db, "articles");
    // Query by section only (avoids needing composite index with orderBy)
    const q = query(articlesRef, where("section", "==", section));
    const querySnapshot = await getDocs(q);
    const articles: Article[] = [];
    querySnapshot.forEach((docSnap) => {
      articles.push({ id: docSnap.id, ...docSnap.data() } as Article);
    });

    // Sort in-memory by createdAt descending
    articles.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    if (limitCount) {
      return articles.slice(0, limitCount);
    }
    return articles;
  } catch (error) {
    console.error("Error in getArticlesBySection:", error);
    return [];
  }
}

// Get popular articles (this month or overall)
export async function getPopularArticles(limitCount: number = 5): Promise<Article[]> {
  try {
    // For this simulation, popular articles will just be a slice of the database
    // In production, you might sort by a 'views' field. Here, we order by createdAt.
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, orderBy("createdAt", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const articles: Article[] = [];
    querySnapshot.forEach((docSnap) => {
      articles.push({ id: docSnap.id, ...docSnap.data() } as Article);
    });
    // Shuffle slightly to simulate popularity differences
    return articles.sort(() => 0.5 - Math.random());
  } catch (error) {
    console.error("Error in getPopularArticles:", error);
    return [];
  }
}

// Create an article
export async function createArticle(articleData: Omit<Article, "slug">): Promise<string> {
  const articlesRef = collection(db, "articles");
  let targetSlug = slugify(articleData.title);
  
  // Verify unique slug
  let existing = await getArticleBySlug(targetSlug);
  let counter = 1;
  while (existing) {
    targetSlug = `${slugify(articleData.title)}-${counter}`;
    existing = await getArticleBySlug(targetSlug);
    counter++;
  }

  const newDocRef = await addDoc(articlesRef, {
    ...articleData,
    slug: targetSlug,
    createdAt: serverTimestamp(),
  });
  return newDocRef.id;
}

// Update an article
export async function updateArticle(id: string, articleData: Partial<Article>): Promise<void> {
  const docRef = doc(db, "articles", id);
  const dataToUpdate = { ...articleData };
  
  if (articleData.title) {
    dataToUpdate.slug = slugify(articleData.title);
  }
  
  await updateDoc(docRef, dataToUpdate);
}

// Delete an article
export async function deleteArticle(id: string): Promise<void> {
  const docRef = doc(db, "articles", id);
  await deleteDoc(docRef);
  
  // Clean up comments associated with this article
  try {
    const commentsRef = collection(db, "comments");
    const q = query(commentsRef, where("articleId", "==", id));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (commentDoc) => {
      await deleteDoc(doc(db, "comments", commentDoc.id));
    });
  } catch (err) {
    console.error("Failed to delete comments of deleted article:", err);
  }
}

// COMMENTS CRUD HELPERS

// Get comments for an article
export async function getComments(articleId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(db, "comments");
    const q = query(
      commentsRef,
      where("articleId", "==", articleId),
      orderBy("createdAt", "asc")
    );
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];
    querySnapshot.forEach((docSnap) => {
      comments.push({ id: docSnap.id, ...docSnap.data() } as Comment);
    });
    return comments;
  } catch (error) {
    console.error("Error in getComments:", error);
    return [];
  }
}

// Add a comment
export async function addComment(commentData: Omit<Comment, "createdAt">): Promise<string> {
  const commentsRef = collection(db, "comments");
  const newDocRef = await addDoc(commentsRef, {
    ...commentData,
    createdAt: serverTimestamp(),
  });
  return newDocRef.id;
}

// Delete a comment (Admin moderation)
export async function deleteComment(id: string): Promise<void> {
  const docRef = doc(db, "comments", id);
  await deleteDoc(docRef);
}
