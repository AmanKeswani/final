import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.string().cuid().optional(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional(),
});

export const createUserSchema = userSchema.omit({ id: true });
export const updateUserSchema = userSchema.partial();

// Post schemas
export const postSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  content: z.string().optional(),
  published: z.boolean().default(false),
  authorId: z.string().cuid('Invalid author ID'),
});

export const createPostSchema = postSchema.omit({ id: true });
export const updatePostSchema = postSchema.partial().omit({ authorId: true });

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Form schemas
export const loginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Post = z.infer<typeof postSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type ApiResponse<T = any> = z.infer<typeof apiResponseSchema> & { data?: T };
export type Pagination = z.infer<typeof paginationSchema>;
export type LoginForm = z.infer<typeof loginFormSchema>;
export type RegisterForm = z.infer<typeof registerFormSchema>;