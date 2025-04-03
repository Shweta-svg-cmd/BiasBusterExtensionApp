import { articles, insertArticleSchema, type Article, type InsertArticle, users, type User, type InsertUser, type BiasedPhrase } from "@shared/schema";
import { z } from "zod";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Article-related methods
  createArticle(article: InsertArticle): Promise<Article>;
  getArticle(id: number): Promise<Article | undefined>;
  getLatestArticle(): Promise<Article | undefined>;
  getRecentArticles(limit: number): Promise<Article[]>;
  getArticleHistory(page: number, limit: number, source?: string): Promise<Article[]>;
  getArticleCount(source?: string, searchTerm?: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articlesMap: Map<number, Article>;
  private userIdCounter: number;
  private articleIdCounter: number;

  constructor() {
    this.users = new Map();
    this.articlesMap = new Map();
    this.userIdCounter = 1;
    this.articleIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.articleIdCounter++;
    const now = new Date();
    
    // Process and ensure all fields have non-undefined values
    const article: Article = {
      id,
      title: insertArticle.title,
      content: insertArticle.content,
      biasScore: insertArticle.biasScore,
      analyzedAt: now,
      source: insertArticle.source || null,
      url: insertArticle.url || null,
      biasAnalysis: insertArticle.biasAnalysis || null,
      neutralText: insertArticle.neutralText || null,
      biasedPhrases: insertArticle.biasedPhrases 
        ? (insertArticle.biasedPhrases as BiasedPhrase[])
        : null,
      politicalLeaning: insertArticle.politicalLeaning || null,
      emotionalLanguage: insertArticle.emotionalLanguage || null,
      factualReporting: insertArticle.factualReporting || null,
      topics: insertArticle.topics ? {
        main: insertArticle.topics.main,
        related: Array.isArray(insertArticle.topics.related) ? 
          Array.from(insertArticle.topics.related) as string[] : []
      } : null,
      multidimensionalAnalysis: insertArticle.multidimensionalAnalysis || null,
    };
    
    this.articlesMap.set(id, article);
    return article;
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articlesMap.get(id);
  }

  async getLatestArticle(): Promise<Article | undefined> {
    const articles = Array.from(this.articlesMap.values());
    if (articles.length === 0) return undefined;
    
    // Sort by analyzedAt (newest first)
    return articles.sort((a, b) => {
      return new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime();
    })[0];
  }

  async getRecentArticles(limit: number): Promise<Article[]> {
    const articles = Array.from(this.articlesMap.values());
    
    // Sort by analyzedAt (newest first)
    return articles
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
      .slice(0, limit);
  }

  async getArticleHistory(page: number, limit: number, source?: string): Promise<Article[]> {
    let articles = Array.from(this.articlesMap.values());
    
    // Filter by source if provided
    if (source) {
      articles = articles.filter(article => 
        article.source && article.source.toLowerCase() === source.toLowerCase()
      );
    }
    
    // Sort by analyzedAt (newest first)
    articles = articles.sort(
      (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
    );
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    return articles.slice(startIndex, startIndex + limit);
  }

  async getArticleCount(source?: string, searchTerm?: string): Promise<number> {
    let articles = Array.from(this.articlesMap.values());
    
    // Filter by source if provided
    if (source) {
      articles = articles.filter(article => 
        article.source && article.source.toLowerCase() === source.toLowerCase()
      );
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(term) || 
        (article.source && article.source.toLowerCase().includes(term))
      );
    }
    
    return articles.length;
  }
}

export const storage = new MemStorage();
