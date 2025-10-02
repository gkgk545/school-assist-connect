import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetSchoolId, setResetSchoolId] = useState('')

  const [loading, setLoading] = useState(false)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        if (session) {
          // 세션이 있으면 여기에서 추가 작업 가능
        }
      } else {
        setIsPasswordRecovery(false);
      }
    });

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !isPasswordRecovery) {
            navigate('/staff-input');
        }
    };
    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, isPasswordRecovery]);
  

  const createEmailFromSchoolId = (id: string) => {
    // 공백, 특수문자를 제거하고 소문자로 변환
    const sanitizedId = id.trim().replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣-]/g, '').toLowerCase();
    return `${sanitizedId}@school.app`;
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: '오류', description: '비밀번호가 일치하지 않습니다.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: '오류', description: '비밀번호는 6자리 이상이어야 합니다.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: '오류', description: '비밀번호 업데이트에 실패했습니다.', variant: 'destructive' });
    } else {
      toast({ title: '성공', description: '비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.' });
      setIsPasswordRecovery(false);
      navigate('/');
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!resetSchoolId) {
      toast({
        title: '오류',
        description: '학교 ID를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const email = createEmailFromSchoolId(resetSchoolId);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`
    });

    if (error) {
      toast({
        title: '오류',
        description: '비밀번호 재설정 메일 전송에 실패했습니다. 학교 ID를 확인해주세요.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '성공',
        description: `비밀번호 재설정 메일이 ${email} 주소로 전송되었습니다. 5분 이상 메일이 오지 않으면 스팸함을 확인해주세요.`,
      });
      setResetDialogOpen(false);
    }
    setLoading(false);
    setResetSchoolId('');
  };

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

    // ID 유효성 검사 추가
    const sanitizedId = signUpSchoolId.trim().replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣-]/g, '').toLowerCase();
    if (!sanitizedId) {
        toast({
            title: "입력 오류",
            description: "학교 ID는 최소 하나 이상의 유효한 문자(한글, 영문, 숫자, 하이픈)를 포함해야 합니다.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true)

    const email = `${sanitizedId}@school.app`;

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
      console.error('Signup Error:', error);
      toast({
        title: "회원가입 실패",
        description: error.message,
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
      setLoginSchoolId(signUpSchoolId);
      setActiveTab('login');
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-education-light p-4">
      {isPasswordRecovery ? (
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>새 비밀번호 설정</CardTitle>
            <CardDescription>새로운 비밀번호를 입력해주세요. 6자리 이상이어야 합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">새 비밀번호</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">비밀번호 확인</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>
                {loading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</T>
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
                    placeholder="예: hangbok-cho" 
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
                <div className="text-center text-sm">
                  <button 
                    type="button" 
                    onClick={() => setResetDialogOpen(true)} 
                    className="text-blue-600 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                </div>
              </CardContent>
            </Card>
          </form>
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>비밀번호 재설정</DialogTitle>
                <DialogDescription>
                  가입 시 사용한 학교 ID를 입력하시면, 비밀번호 재설정 안내 메일이 발송됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Label htmlFor="reset-school-id">학교 ID</Label>
                <Input
                  id="reset-school-id"
                  value={resetSchoolId}
                  onChange={(e) => setResetSchoolId(e.target.value)}
                  placeholder="예: hangbok-cho"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>취소</Button>
                <Button onClick={handlePasswordReset} disabled={loading}>
                  {loading ? '전송 중...' : '재설정 메일 전송'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    placeholder="한글, 영문, 숫자, 하이픈(-)만 가능" 
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
