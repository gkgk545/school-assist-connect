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
  const [schoolName, setSchoolName] = useState('')
  const [contactName, setContactName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  // 학교명을 고유한 이메일 형식으로 변환하는 헬퍼 함수
  const createEmailFromSchoolName = (name: string) => {
    // 공백을 제거하고, 특수문자를 일부 제거한 후, 고유한 도메인을 붙여줍니다.
    const sanitizedName = name.replace(/\s+/g, '').toLowerCase();
    return `${sanitizedName}@school.app`;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // 입력된 학교명으로 이메일 생성
    const email = createEmailFromSchoolName(schoolName);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
    if (!schoolName || !contactName || !password) {
        toast({
            title: "입력 오류",
            description: "모든 필드를 입력해주세요.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true)

    // 입력된 학교명으로 이메일 생성
    const email = createEmailFromSchoolName(schoolName);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          school_name: schoolName,
          contact_name: contactName,
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
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">비밀번호</Label>
                  <Input 
                    id="password-login" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  필요한 정보를 입력하여 계정을 생성하세요.
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
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-name-signup">담당자명</Label>
                  <Input 
                    id="contact-name-signup" 
                    type="text" 
                    placeholder="홍길동" 
                    required 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">비밀번호</Label>
                  <Input 
                    id="password-signup" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
