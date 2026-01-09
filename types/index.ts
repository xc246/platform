export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          user_id: string
          type: 'lost' | 'found'
          title: string
          description: string | null
          item_category: string | null
          location: string | null
          lost_found_date: string | null
          image_urls: string[] | null
          status: 'open' | 'closed'
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: 'lost' | 'found'
          title: string
          description?: string | null
          item_category?: string | null
          location?: string | null
          lost_found_date?: string | null
          image_urls?: string[] | null
          status?: 'open' | 'closed'
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: 'lost' | 'found'
          title?: string
          description?: string | null
          item_category?: string | null
          location?: string | null
          lost_found_date?: string | null
          image_urls?: string[] | null
          status?: 'open' | 'closed'
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          post_id: number
          user_id: string | null
          content: string
          is_anonymous: boolean
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          user_id?: string | null
          content: string
          is_anonymous?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          user_id?: string | null
          content?: string
          is_anonymous?: boolean
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']

export type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: {
    id: string
    nickname: string | null
    avatar_url: string | null
  }
}

export type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles?: {
    id: string
    nickname: string | null
    avatar_url: string | null
  }
}
