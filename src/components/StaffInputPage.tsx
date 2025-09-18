import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Users, Save } from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  department: string
  position: 'principal' | 'vice_principal' | 'department_head' | 'staff'
  contact: string
}

const POSITION_LABELS = {
  principal: '교장',
  vice_principal: '교감',
  department_head: '부서장',
  staff: '부원'
}

export const StaffInputPage = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    { id: '1', name: '', department: '', position: 'staff', contact: '' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/')
      return
    }
    setUser(user)
    
    // Load existing staff data if available
    loadExistingStaff(user.id)
  }

  const loadExistingStaff = async (userId: string) => {
    try {
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('*')
        .eq('school_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (staffData && staffData.length > 0) {
        const formattedStaff = staffData.map(staff => ({
          id: staff.id,
          name: staff.name,
          department: staff.department,
          position: staff.position as any,
          contact: staff.contact
        }))
        setStaffMembers(formattedStaff)
      }
    } catch (error: any) {
      console.error('Error loading staff:', error)
    }
  }

  const addStaffMember = () => {
    const newId = Math.random().toString(36).substr(2, 9)
    setStaffMembers([
      ...staffMembers,
      { id: newId, name: '', department: '', position: 'staff', contact: '' }
    ])
  }

  const removeStaffMember = (id: string) => {
    if (staffMembers.length > 1) {
      setStaffMembers(staffMembers.filter(member => member.id !== id))
    }
  }

  const updateStaffMember = (id: string, field: keyof StaffMember, value: string) => {
    setStaffMembers(staffMembers.map(member =>
      member.id === id ? { ...member, [field]: value } : member
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const emptyFields = staffMembers.some(member => 
      !member.name.trim() || !member.department.trim() || !member.contact.trim()
    )
    
    if (emptyFields) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Delete existing staff data
      await supabase
        .from('staff')
        .delete()
        .eq('school_id', user.id)

      // Insert new staff data
      const staffData = staffMembers.map(member => ({
        school_id: user.id,
        name: member.name,
        department: member.department,
        position: member.position,
        contact: member.contact
      }))

      const { error } = await supabase
        .from('staff')
        .insert(staffData)

      if (error) throw error

      toast({
        title: "저장 완료",
        description: "교직원 정보가 저장되었습니다.",
      })

      navigate('/emergency-network')
    } catch (error: any) {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-education-primary" />
              <div>
                <h1 className="text-2xl font-bold text-education-primary">교직원 정보 입력</h1>
                <p className="text-education-neutral">비상연락망에 포함될 교직원 정보를 입력하세요</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">교직원 목록</h2>
            <Button
              type="button"
              onClick={addStaffMember}
              className="bg-gradient-secondary hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              직원 추가
            </Button>
          </div>

          <div className="grid gap-6">
            {staffMembers.map((member, index) => (
              <Card key={member.id} className="shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">직원 #{index + 1}</CardTitle>
                    {staffMembers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStaffMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${member.id}`}>이름 *</Label>
                      <Input
                        id={`name-${member.id}`}
                        type="text"
                        placeholder="홍길동"
                        value={member.name}
                        onChange={(e) => updateStaffMember(member.id, 'name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`department-${member.id}`}>부서명 *</Label>
                      <Input
                        id={`department-${member.id}`}
                        type="text"
                        placeholder="교무부"
                        value={member.department}
                        onChange={(e) => updateStaffMember(member.id, 'department', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`position-${member.id}`}>직위 *</Label>
                      <Select
                        value={member.position}
                        onValueChange={(value) => updateStaffMember(member.id, 'position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="직위 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principal">교장</SelectItem>
                          <SelectItem value="vice_principal">교감</SelectItem>
                          <SelectItem value="department_head">부서장</SelectItem>
                          <SelectItem value="staff">부원</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`contact-${member.id}`}>연락처 *</Label>
                      <Input
                        id={`contact-${member.id}`}
                        type="text"
                        placeholder="010-1234-5678"
                        value={member.contact}
                        onChange={(e) => updateStaffMember(member.id, 'contact', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/emergency-network')}
            >
              나중에 하기
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary hover:opacity-90"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? '저장 중...' : '저장 및 연락망 생성'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}