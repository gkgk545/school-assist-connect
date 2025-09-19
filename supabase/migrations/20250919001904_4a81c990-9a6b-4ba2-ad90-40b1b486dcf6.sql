-- Create staff table for storing staff members
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('principal', 'vice_principal', 'department_head', 'staff')),
  contact TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_layouts table for storing organizational chart layouts
CREATE TABLE public.organization_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  layout_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies for staff table
CREATE POLICY "Users can view their own staff" 
ON public.staff 
FOR SELECT 
USING (auth.uid() = school_id);

CREATE POLICY "Authenticated users can insert their own staff"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = school_id);

CREATE POLICY "Users can update their own staff" 
ON public.staff 
FOR UPDATE 
USING (auth.uid() = school_id);

CREATE POLICY "Users can delete their own staff" 
ON public.staff 
FOR DELETE 
USING (auth.uid() = school_id);

-- Create policies for organization_layouts table
CREATE POLICY "Users can view their own layouts" 
ON public.organization_layouts 
FOR SELECT 
USING (auth.uid() = school_id);

CREATE POLICY "Users can create their own layouts" 
ON public.organization_layouts 
FOR INSERT 
WITH CHECK (auth.uid() = school_id);

CREATE POLICY "Users can update their own layouts" 
ON public.organization_layouts 
FOR UPDATE 
USING (auth.uid() = school_id);

CREATE POLICY "Users can delete their own layouts" 
ON public.organization_layouts 
FOR DELETE 
USING (auth.uid() = school_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_layouts_updated_at
BEFORE UPDATE ON public.organization_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_staff_school_id ON public.staff(school_id);
CREATE INDEX idx_organization_layouts_school_id ON public.organization_layouts(school_id);
