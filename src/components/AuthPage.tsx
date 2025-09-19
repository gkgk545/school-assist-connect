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
  const [loginSchoolName, setLoginSchoolName] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  const [signUpSchoolName, setSignUpSchoolName] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')

  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  const createEmailFromSchoolName = (name: string) => {
    const sanitizedName = name.replace(/\s+/g, '').toLowerCase();
    return `${sanitizedName}@school.app`;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const email = createEmailFromSchoolName(loginSchoolName);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    })

    if (error) {
      toast({
        title: "로그인 실패",
        description: "학교명 또는 비밀번호를 확인해주세요.",
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
    if (!signUpSchoolName || !signUpPassword) {
        toast({
            title: "입력 오류",
            description: "학교명과 비밀번호를 모두 입력해주세요.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true)

    const email = createEmailFromSchoolName(signUpSchoolName);

    const { error } = await supabase.auth.signUp({
      email,
      password: signUpPassword,
      options: {
        data: {
          school_name: signUpSchoolName,
        }
      }
    })

    if (error) {
      toast({
        title: "회원가입 실패",
        description: "이미 등록된 학교명일 수 있습니다. 다른 이름으로 시도해주세요.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "회원가입 성공",
        description: "로그인 탭에서 로그인해주세요.",
      })
      // 회원가입 성공 후 입력 필드 초기화
      setSignUpSchoolName('');
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
                  학교명과 비밀번호를 입력하여 로그인하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school-name-login">학교명</Label>
                  <Input 
                    id="school-name-login" 
                    type="text" 
                    placeholder="예: 행복초등학교" 
                    required 
                    value={loginSchoolName}
                    onChange={(e) => setLoginSchoolName(e.target.value)}
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
                  학교명과 비밀번호를 입력하여 계정을 생성하세요.
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
