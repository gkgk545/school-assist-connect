import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginSchoolId, setLoginSchoolId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  const [signUpSchoolId, setSignUpSchoolId] = useState('')
  const [signUpSchoolName, setSignUpSchoolName] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')

  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate('/staff-input');
        }
    };
    checkUser();
  }, [navigate]);
  

  // 학교 ID를 기반으로 이메일 주소 생성
  const createEmailFromSchoolId = (id: string) => {
    const sanitizedId = id.trim().toLowerCase();
    return `${sanitizedId}@school.app`;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const email = createEmailFromSchoolId(loginSchoolId);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    })

    if (error) {
      toast({
        title: "로그인 실패",
        description: "학교 ID 또는 비밀번호를 확인해주세요.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "로그인 성공",
        description: "교직원 정보 입력 페이지로 이동합니다.",
      })
      navigate('/staff-input')
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpSchoolId || !signUpSchoolName || !signUpPassword) {
        toast({
            title: "입력 오류",
            description: "모든 필드를 입력해주세요.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true)

    const email = createEmailFromSchoolId(signUpSchoolId);

    const { error } = await supabase.auth.signUp({
      email,
      password: signUpPassword,
      options: {
        data: {
          school_name: signUpSchoolName, // 표시될 학교 이름은 메타데이터로 저장
        }
      }
    })

    if (error) {
      console.error('Signup Error:', error);
      toast({
        title: "회원가입 실패",
        description: error.message, // Supabase의 실제 에러 메시지를 표시
        variant: "destructive",
      })
    } else {
      toast({
        title: "회원가입 성공!",
        description: "로그인 탭에서 바로 로그인해주세요.",
      })
      setSignUpSchoolId('');
      setSignUpSchoolName('');
      setSignUpPassword('');
      setLoginSchoolId(signUpSchoolId); // 편의를 위해 로그인 폼에 ID 채워주기
      setActiveTab('login');
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-education-light p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
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
                  가입 시 사용한 학교 ID와 비밀번호를 입력하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school-id-login">학교 ID</Label>
                  <Input 
                    id="school-id-login" 
                    type="text" 
                    placeholder="예: hangbok_cho" 
                    required 
                    value={loginSchoolId}
                    onChange={(e) => setLoginSchoolId(e.target.value)}
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
                  다른 학교와 겹치지 않는 고유 ID를 만들어주세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school-id-signup">학교 ID (로그인 시 사용)</Label>
                  <Input 
                    id="school-id-signup" 
                    type="text" 
                    placeholder="공백 없는 영문, 숫자 조합" 
                    required 
                    value={signUpSchoolId}
                    onChange={(e) => setSignUpSchoolId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school-name-signup">학교명 (표시용)</Label>
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
