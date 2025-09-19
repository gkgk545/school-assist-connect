// src/components/AuthPage.tsx

import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

export const AuthPage = () => {
  // 로그인과 회원가입의 상태를 분리
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  const [signUpSchoolName, setSignUpSchoolName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')

  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (error) {
      toast({
        title: "로그인 실패",
        description: "이메일 또는 비밀번호를 확인해주세요.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "로그인 성공",
        description: "비상연락망 페이지로 이동합니다.",
      })
      navigate('/staff-input')
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpSchoolName || !signUpEmail || !signUpPassword) {
        toast({
            title: "입력 오류",
            description: "모든 필드를 입력해주세요.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: {
          school_name: signUpSchoolName,
        }
      }
    })

    if (error) {
      console.error('Signup Error:', error);
      toast({
        title: "회원가입 실패",
        description: error.message || "이미 사용 중인 이메일이거나 다른 문제가 발생했습니다.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "회원가입 성공!",
        description: "가입 확인을 위해 이메일을 확인해주세요. (이메일 인증을 비활성화한 경우, 바로 로그인 가능합니다.)",
      })
      setSignUpSchoolName('');
      setSignUpEmail('');
      setSignUpPassword('');
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-education-light p-4">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">로그인</TabsTrigger>
          <TabsTrigger value="signup">회원가입</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <Card>
              <CardHeader>
                <CardTitle>로그인</CardTitle>
                <CardDescription>
                  이메일과 비밀번호를 입력하여 로그인하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">이메일</Label>
                  <Input 
                    id="email-login" 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">비밀번호</Label>
                  <Input 
                    id="password-login" 
                    type="password" 
                    required 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>
                  {loading ? '로그인 중...' : '로그인'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={handleSignUp}>
            <Card>
              <CardHeader>
                <CardTitle>회원가입</CardTitle>
                <CardDescription>
                  학교명, 이메일, 비밀번호를 입력하여 계정을 생성하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school-name-signup">학교명</Label>
                  <Input 
                    id="school-name-signup" 
                    type="text" 
                    placeholder="예: 행복초등학교" 
                    required 
                    value={signUpSchoolName}
                    onChange={(e) => setSignUpSchoolName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">이메일</Label>
                  <Input 
                    id="email-signup" 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">비밀번호</Label>
                  <Input 
                    id="password-signup" 
                    type="password" 
                    required 
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    minLength={6}
                    placeholder="6자리 이상 입력해주세요"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-secondary hover:opacity-90" disabled={loading}>
                  {loading ? '가입 중...' : '회원가입'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
