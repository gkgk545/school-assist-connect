import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Network, 
  Save, 
  Printer, 
  Download, 
  Share2, 
  Edit3, 
  Users,
  Copy,
  CheckCircle
} from 'lucide-react'
import html2canvas from 'html2canvas'

interface StaffMember {
  id: string
  name: string
  department: string
  position: 'principal' | 'vice_principal' | 'department_head' | 'staff'
  contact: string
}

interface OrganizationNode {
  id: string
  staff: StaffMember
  children: OrganizationNode[]
  level: number
}

const POSITION_LABELS = {
  principal: '교장',
  vice_principal: '교감',
  department_head: '부서장',
  staff: '부원'
}

const POSITION_ORDER = {
  principal: 1,
  vice_principal: 2,
  department_head: 3,
  staff: 4
}

export const EmergencyNetworkPage = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [organizationTree, setOrganizationTree] = useState<OrganizationNode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const orgChartRef = useRef<HTMLDivElement>(null)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (staffMembers.length > 0) {
      generateOrganizationTree()
    }
  }, [staffMembers])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/')
      return
    }
    setUser(user)
    loadStaffData(user.id)
  }

  const loadStaffData = async (userId: string) => {
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
          position: staff.position as 'principal' | 'vice_principal' | 'department_head' | 'staff',
          contact: staff.contact
        }))
        setStaffMembers(formattedStaff)
      } else {
        // No staff data, redirect to input page
        navigate('/staff-input')
      }
    } catch (error: any) {
      console.error('Error loading staff:', error)
      toast({
        title: "데이터 로드 실패",
        description: "교직원 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const generateOrganizationTree = () => {
    // Group staff by position and department
    const principalStaff = staffMembers.filter(s => s.position === 'principal')
    const vicePrincipalStaff = staffMembers.filter(s => s.position === 'vice_principal')
    const departmentHeads = staffMembers.filter(s => s.position === 'department_head')
    const regularStaff = staffMembers.filter(s => s.position === 'staff')

    // Create tree structure
    const tree: OrganizationNode[] = []

    // Level 1: Principal
    principalStaff.forEach(principal => {
      const principalNode: OrganizationNode = {
        id: principal.id,
        staff: principal,
        children: [],
        level: 1
      }

      // Level 2: Vice Principals under this principal
      vicePrincipalStaff.forEach(vp => {
        const vpNode: OrganizationNode = {
          id: vp.id,
          staff: vp,
          children: [],
          level: 2
        }

        // Level 3: Department Heads under vice principals
        departmentHeads.forEach(dh => {
          const dhNode: OrganizationNode = {
            id: dh.id,
            staff: dh,
            children: [],
            level: 3
          }

          // Level 4: Staff under department heads (same department)
          const departmentStaff = regularStaff.filter(s => s.department === dh.department)
          departmentStaff.forEach(staff => {
            dhNode.children.push({
              id: staff.id,
              staff: staff,
              children: [],
              level: 4
            })
          })

          vpNode.children.push(dhNode)
        })

        // Add staff without department heads directly under VP
        const staffWithoutHeads = regularStaff.filter(s => 
          !departmentHeads.some(dh => dh.department === s.department)
        )
        staffWithoutHeads.forEach(staff => {
          vpNode.children.push({
            id: staff.id,
            staff: staff,
            children: [],
            level: 3
          })
        })

        principalNode.children.push(vpNode)
      })

      // If no vice principals, add department heads directly under principal
      if (vicePrincipalStaff.length === 0) {
        departmentHeads.forEach(dh => {
          const dhNode: OrganizationNode = {
            id: dh.id,
            staff: dh,
            children: [],
            level: 2
          }

          const departmentStaff = regularStaff.filter(s => s.department === dh.department)
          departmentStaff.forEach(staff => {
            dhNode.children.push({
              id: staff.id,
              staff: staff,
              children: [],
              level: 3
            })
          })

          principalNode.children.push(dhNode)
        })

        // Add staff without department heads directly under principal
        const staffWithoutHeads = regularStaff.filter(s => 
          !departmentHeads.some(dh => dh.department === s.department)
        )
        staffWithoutHeads.forEach(staff => {
          principalNode.children.push({
            id: staff.id,
            staff: staff,
            children: [],
            level: 2
          })
        })
      }

      tree.push(principalNode)
    })

    // If no principal, start with vice principals
    if (principalStaff.length === 0 && vicePrincipalStaff.length > 0) {
      vicePrincipalStaff.forEach(vp => {
        const vpNode: OrganizationNode = {
          id: vp.id,
          staff: vp,
          children: [],
          level: 1
        }

        departmentHeads.forEach(dh => {
          const dhNode: OrganizationNode = {
            id: dh.id,
            staff: dh,
            children: [],
            level: 2
          }

          const departmentStaff = regularStaff.filter(s => s.department === dh.department)
          departmentStaff.forEach(staff => {
            dhNode.children.push({
              id: staff.id,
              staff: staff,
              children: [],
              level: 3
            })
          })

          vpNode.children.push(dhNode)
        })

        tree.push(vpNode)
      })
    }

    setOrganizationTree(tree)
  }


  const handleSaveLayout = async () => {
    setIsLoading(true)
    try {
      const layoutData = {
        tree: organizationTree,
        lastUpdated: new Date().toISOString()
      }

      const { error } = await supabase
        .from('organization_layouts')
        .upsert({
          school_id: user.id,
          layout_data: layoutData as any
        })

      if (error) throw error

      toast({
        title: "레이아웃 저장됨",
        description: "조직도 레이아웃이 저장되었습니다.",
      })
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

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadImage = async () => {
    if (!orgChartRef.current) return

    try {
      const canvas = await html2canvas(orgChartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      })
      
      const link = document.createElement('a')
      link.download = `비상연락망_${new Date().toLocaleDateString()}.png`
      link.href = canvas.toDataURL()
      link.click()

      toast({
        title: "이미지 다운로드",
        description: "비상연락망 이미지가 다운로드되었습니다.",
      })
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "이미지 생성에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateShareLink = async () => {
    try {
      // Generate a shareable URL (simplified version)
      const shareId = Math.random().toString(36).substr(2, 9)
      const url = `${window.location.origin}/share/${shareId}`
      setShareUrl(url)

      // Copy to clipboard
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)

      toast({
        title: "공유 링크 생성됨",
        description: "링크가 클립보드에 복사되었습니다.",
      })
    } catch (error) {
      toast({
        title: "링크 생성 실패",
        description: "공유 링크 생성에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const renderOrganizationNode = (node: OrganizationNode) => (
    <div key={node.id} className="flex flex-col items-center">
      {/* Staff Member Box */}
      <div className="relative">
        <Card className={`shadow-medium border-2 transition-all hover:shadow-lg min-w-[200px] ${
          node.level === 1 ? 'bg-gradient-primary text-white border-blue-500' :
          node.level === 2 ? 'bg-blue-50 border-blue-300' :
          node.level === 3 ? 'bg-green-50 border-green-300' :
          'bg-gray-50 border-gray-300'
        }`}>
          <CardContent className="p-3 text-center">
            <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
              node.level === 1 ? 'bg-white/20 text-white' :
              node.level === 2 ? 'bg-blue-100 text-blue-700' :
              node.level === 3 ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {POSITION_LABELS[node.staff.position]}
            </div>
            <h3 className={`font-bold text-sm mb-1 ${
              node.level === 1 ? 'text-white' : 'text-gray-800'
            }`}>
              {node.staff.name}
            </h3>
            <p className={`text-xs ${
              node.level === 1 ? 'text-white/90' : 'text-gray-600'
            }`}>
              {node.staff.department}
            </p>
            <p className={`text-xs mt-1 ${
              node.level === 1 ? 'text-white/80' : 'text-gray-500'
            }`}>
              {node.staff.contact}
            </p>
          </CardContent>
        </Card>
        
        {/* Connecting line downward */}
        {node.children.length > 0 && (
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-400 top-full"></div>
        )}
      </div>
      
      {/* Children */}
      {node.children.length > 0 && (
        <div className="mt-8 flex flex-col items-center">
          {/* Horizontal line for multiple children */}
          {node.children.length > 1 && (
            <div className="relative flex items-center justify-center w-full mb-8">
              <div className="h-0.5 bg-gray-400 w-full absolute top-0"></div>
              {node.children.map((_, index) => (
                <div 
                  key={index}
                  className="w-0.5 h-8 bg-gray-400 absolute top-0"
                  style={{
                    left: `${(100 / (node.children.length + 1)) * (index + 1)}%`,
                    transform: 'translateX(-50%)'
                  }}
                ></div>
              ))}
            </div>
          )}
          
          {/* Single child - just a vertical line */}
          {node.children.length === 1 && (
            <div className="w-0.5 h-8 bg-gray-400 mb-0"></div>
          )}
          
          {/* Children nodes */}
          <div className={`flex gap-12 items-start ${
            node.children.length > 1 ? 'justify-center' : ''
          }`}>
            {node.children.map((child) => 
              renderOrganizationNode(child)
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Network className="h-8 w-8 text-education-primary" />
              <div>
                <h1 className="text-2xl font-bold text-education-primary">비상연락망</h1>
                <p className="text-education-neutral">계층형 조직도</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => navigate('/staff-input')}>
                <Edit3 className="h-4 w-4 mr-2" />
                직원 수정
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="mb-6 print:hidden">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSaveLayout} disabled={isLoading} className="bg-gradient-primary hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? '저장 중...' : '레이아웃 저장'}
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  인쇄
                </Button>
                <Button variant="outline" onClick={handleDownloadImage}>
                  <Download className="h-4 w-4 mr-2" />
                  이미지 다운로드
                </Button>
                <Button variant="outline" onClick={handleGenerateShareLink}>
                  {copySuccess ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  {copySuccess ? '복사됨!' : '링크 공유'}
                </Button>
              </div>
            </div>

            <div ref={orgChartRef} className="bg-white rounded-lg shadow-soft p-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-education-primary mb-2">
                  {user?.user_metadata?.school_name || '학교'} 비상연락망
                </h2>
                <p className="text-education-neutral">
                  생성일: {new Date().toLocaleDateString()}
                </p>
              </div>

              {organizationTree.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="min-w-max py-8">
                    <div className="flex flex-col items-center space-y-16">
                      {organizationTree.map((node) => 
                        renderOrganizationNode(node)
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-education-neutral/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-education-neutral mb-2">
                    교직원 정보가 없습니다
                  </h3>
                  <p className="text-education-neutral/80 mb-6">
                    먼저 교직원 정보를 입력해주세요.
                  </p>
                  <Button onClick={() => navigate('/staff-input')} className="bg-gradient-primary hover:opacity-90">
                    교직원 정보 입력하기
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-80 print:hidden">
            <Card className="shadow-medium">
              <CardContent className="p-6">
                <h3 className="font-semibold text-education-primary mb-4">사용 방법</h3>
                <div className="space-y-3 text-sm text-education-neutral">
                   <div className="flex items-start space-x-2">
                     <div className="w-2 h-2 bg-education-primary rounded-full mt-2 flex-shrink-0"></div>
                     <p>계층형 조직도로 구조를 명확하게 확인할 수 있습니다.</p>
                   </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-education-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <p>변경 후 '레이아웃 저장' 버튼을 눌러 저장하세요.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-education-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>인쇄 또는 이미지로 다운로드할 수 있습니다.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-education-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <p>'링크 공유'로 다른 사람과 공유할 수 있습니다.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {shareUrl && (
              <Card className="mt-4 shadow-medium">
                <CardContent className="p-4">
                  <h4 className="font-medium text-education-primary mb-2">공유 링크</h4>
                  <div className="flex items-center space-x-2">
                    <Input value={shareUrl} readOnly className="text-xs" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            body {
              background: white !important;
            }
          }
        `
      }} />
    </div>
  )
}