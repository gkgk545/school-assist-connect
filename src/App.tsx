import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './integrations/supabase/client'
import './App.css'
import { AuthPage } from './components/AuthPage'
import { EmergencyNetworkPage } from './components/EmergencyNetworkPage'
import { StaffInputPage } from './components/StaffInputPage'
import { useToast } from './hooks/use-toast'

function App() {
  const { toast } = useToast()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        toast({ 
          title: '비밀번호 변경', 
          description: '새로운 비밀번호를 설정해주세요.' 
        })
      }
    });
  
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/update-password" element={<AuthPage />} />
        <Route path="/staff-input" element={<StaffInputPage />} />
        <Route path="/emergency-network" element={<EmergencyNetworkPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
