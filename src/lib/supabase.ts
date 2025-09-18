import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          school_name: string
          contact_person: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          school_name: string
          contact_person: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          school_name?: string
          contact_person?: string
          created_at?: string
          user_id?: string
        }
      }
      staff: {
        Row: {
          id: string
          school_id: string
          name: string
          department: string
          position: 'principal' | 'vice_principal' | 'department_head' | 'staff'
          contact: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          name: string
          department: string
          position: 'principal' | 'vice_principal' | 'department_head' | 'staff'
          contact: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          name?: string
          department?: string
          position?: 'principal' | 'vice_principal' | 'department_head' | 'staff'
          contact?: string
          created_at?: string
        }
      }
      organization_layouts: {
        Row: {
          id: string
          school_id: string
          layout_data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          layout_data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          layout_data?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}