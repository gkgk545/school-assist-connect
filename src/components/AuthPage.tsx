import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { GraduationCap, Users, Shield } from 'lucide-react'
import heroImage from '@/assets/school-network-hero.png'

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  const [signupForm, setSignupForm] = useState({
    schoolName: '',
    contactPerson: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      })

      if (error) {
        if (error.message === 'Email not confirmed') {
          toast({
            title: "이메일 인증 필요",
            description: "회원가입 시 보낸 이메일의 인증 링크를 클릭해주세요.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "로그인 실패",
            description: error.message,
            variant: "destructive",
          })
        }
        return
      }

      toast({
        title: "로그인 성공",
        description: "성공적으로 로그인했습니다.",
      })

      navigate('/staff-input')
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            school_name: signupForm.schoolName,
            contact_person: signupForm.contactPerson,
          }
        }
      })

      if (error) throw error

      toast({
        title: "회원가입 성공",
        description: `${signupForm.schoolName} 계정이 생성되었습니다.`,
      })

      navigate('/staff-input')
    } catch (error: any) {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(34, 197, 94, 0.8) 100%), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">스쿨 비상연락망</h1>
          <p className="text-white/80">학교 비상연락망을 쉽게 만들고 관리하세요</p>
        </div>

        <Card className="shadow-strong backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-education-primary">시작하기</CardTitle>
            <CardDescription>로그인하거나 새 계정을 만드세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="school@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={isLoading}>
                    {isLoading ? '로그인 중...' : '로그인'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-school">학교명</Label>
                    <Input
                      id="signup-school"
                      type="text"
                      placeholder="○○초등학교"
                      value={signupForm.schoolName}
                      onChange={(e) => setSignupForm({ ...signupForm, schoolName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-contact">담당자명</Label>
                    <Input
                      id="signup-contact"
                      type="text"
                      placeholder="홍길동"
                      value={signupForm.contactPerson}
                      onChange={(e) => setSignupForm({ ...signupForm, contactPerson: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="school@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">비밀번호 확인</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-secondary hover:opacity-90" disabled={isLoading}>
                    {isLoading ? '계정 생성 중...' : '계정 생성'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-white/70">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">교직원 관리</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">안전한 공유</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}