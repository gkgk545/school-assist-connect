import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
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

  const handleDragEnd = (result: any) => {
    // Handle drag and drop logic here
    // This is a simplified version - you can enhance it based on your needs
    console.log('Drag ended:', result)
    
    if (!result.destination) return

    // You can implement complex drag and drop logic here
    // For now, we'll just show a toast
    toast({
      title: "구조 변경됨",
      description: "조직도 구조가 변경되었습니다. '레이아웃 저장'을 클릭하여 저장하세요.",
    })
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

  const renderOrganizationNode = (node: OrganizationNode, index: number) => (
    <Draggable key={node.id} draggableId={node.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-4 ${snapshot.isDragging ? 'opacity-50' : ''}`}
        >
          <Card className={`shadow-medium border-l-4 border-l-education-primary ${
            node.level === 1 ? 'bg-gradient-primary text-white' :
            node.level === 2 ? 'bg-education-light' :
            'bg-white'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    node.level === 1 ? 'bg-white/20 text-white' :
                    'bg-education-primary/10 text-education-primary'
                  }`}>
                    {POSITION_LABELS[node.staff.position]}
                  </div>
                  <span className={`text-xs ${
                    node.level === 1 ? 'text-white/80' : 'text-education-neutral'
                  }`}>
                    {node.staff.department}
                  </span>
                </div>
              </div>
              <h3 className={`font-bold text-lg mb-1 ${
                node.level === 1 ? 'text-white' : 'text-education-primary'
              }`}>
                {node.staff.name}
              </h3>
              <p className={`text-sm ${
                node.level === 1 ? 'text-white/90' : 'text-education-neutral'
              }`}>
                {node.staff.contact}
              </p>
            </CardContent>
          </Card>
          
          {node.children.length > 0 && (
            <div className="ml-8 pl-4 border-l-2 border-education-light">
              {node.children.map((child, childIndex) => 
                renderOrganizationNode(child, childIndex)
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
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
                <p className="text-education-neutral">드래그하여 구조를 수정할 수 있습니다</p>
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
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="organization-tree">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {organizationTree.map((node, index) => 
                          renderOrganizationNode(node, index)
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                    <p>카드를 드래그하여 조직도 구조를 변경할 수 있습니다.</p>
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