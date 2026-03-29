export type TopicComplexity = 'simple' | 'standard' | 'complex'
export type TopicStatus = 'pending' | 'extracted' | 'has_content'
export type CharacterTypeEnum = 'core' | 'guest'
export type ContentType = 'manga' | 'anime' | 'drama'
export type ContentStatus =
  | 'queued'
  | 'generating_scenario'
  | 'generating_images'
  | 'generating_video'
  | 'complete'
  | 'failed'
export type AssetType = 'image' | 'video' | 'audio' | 'svg_fallback'

// Simplified Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          streak_days: number
          last_study_date: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          streak_days?: number
          last_study_date?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string | null
          streak_days?: number
          last_study_date?: string | null
        }
        Relationships: []
      }
      textbooks: {
        Row: {
          id: string
          user_id: string
          title: string
          file_path: string
          total_pages: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_path: string
          total_pages?: number | null
        }
        Update: {
          title?: string
          file_path?: string
          total_pages?: number | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          textbook_id: string
          name: string
          chapter_number: number
          color: string | null
        }
        Insert: {
          id?: string
          textbook_id: string
          name: string
          chapter_number: number
          color?: string | null
        }
        Update: {
          name?: string
          chapter_number?: number
          color?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          chapter_id: string
          name: string
          article: string | null
          page_range: string | null
          extracted_content: string | null
          complexity: TopicComplexity
          status: TopicStatus
        }
        Insert: {
          id?: string
          chapter_id: string
          name: string
          article?: string | null
          page_range?: string | null
          extracted_content?: string | null
          complexity?: TopicComplexity
          status?: TopicStatus
        }
        Update: {
          name?: string
          article?: string | null
          extracted_content?: string | null
          complexity?: TopicComplexity
          status?: TopicStatus
        }
        Relationships: []
      }
      character_sheets: {
        Row: {
          id: string
          user_id: string
          character_key: string
          character_type: CharacterTypeEnum
          storage_path: string
          public_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_key: string
          character_type: CharacterTypeEnum
          storage_path: string
          public_url?: string | null
        }
        Update: {
          storage_path?: string
          public_url?: string | null
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          content_type: ContentType
          panel_count: number | null
          cast_json: Record<string, unknown> | null
          scenario_json: Record<string, unknown> | null
          status: ContentStatus
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          content_type: ContentType
          panel_count?: number | null
          cast_json?: Record<string, unknown> | null
          scenario_json?: Record<string, unknown> | null
          status?: ContentStatus
        }
        Update: {
          panel_count?: number | null
          cast_json?: Record<string, unknown> | null
          scenario_json?: Record<string, unknown> | null
          status?: ContentStatus
        }
        Relationships: []
      }
      content_assets: {
        Row: {
          id: string
          content_id: string
          asset_type: AssetType
          panel_number: number | null
          storage_path: string
          public_url: string | null
          overlay_data: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          asset_type: AssetType
          panel_number?: number | null
          storage_path: string
          public_url?: string | null
          overlay_data?: Record<string, unknown> | null
        }
        Update: {
          public_url?: string | null
          overlay_data?: Record<string, unknown> | null
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          id: string
          topic_id: string
          content_id: string | null
          question: string
          choices: string[]
          correct_index: number
          explanation: string
          wrong_explanations: Record<string, string> | null
        }
        Insert: {
          id?: string
          topic_id: string
          content_id?: string | null
          question: string
          choices: string[]
          correct_index: number
          explanation: string
          wrong_explanations?: Record<string, string> | null
        }
        Update: {
          question?: string
          choices?: string[]
          correct_index?: number
          explanation?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          selected_index: number
          is_correct: boolean
          attempted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          selected_index: number
          is_correct: boolean
        }
        Update: {
          id?: never
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          content_type: string
          duration_seconds: number
          studied_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          content_type: string
          duration_seconds?: number
        }
        Update: {
          duration_seconds?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
