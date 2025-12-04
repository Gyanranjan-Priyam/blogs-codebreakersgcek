export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  tags?: string[];
  category?: string;
}

export interface User {
  id: string;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
}
