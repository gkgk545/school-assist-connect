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
  CheckCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

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
}

const POSITION_LABELS = {
  principal: '교장',
  vice_principal: '교감',
  department_head: '부서장',
  staff: '부원'
}

const getPositionOrder = (position: StaffMember['position']) => {
  switch (position) {
    case 'principal': return 1;
    case 'vice_principal': return 2;
    case 'department_head': return 3;
    case 'staff': return 4;
    default: return 5;
  }
}

const Controls = ({ zoomIn, zoomOut, resetTransform }: { zoomIn: () => void, zoomOut: () => void, resetTransform: () => void }) => {
    return (
        <div className="flex gap-2 p-2 rounded-md bg-white border shadow-md print:hidden">
            <Button variant="outline" size="icon" onClick={() => zoomIn()} aria-label="Zoom In">
                <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => zoomOut()} aria-label="Zoom Out">
                <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => resetTransform()} aria-label="Reset Zoom">
                <RotateCcw className="h-4 w-4" />
            </Button>
        </div>
    );
};

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
    setIsLoading(true);
    try {
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('*')
        .eq('school_id', userId);

      if (error) throw error

      if (staffData && staffData.length > 0) {
        const sortedStaff = staffData.sort((a, b) => 
          getPositionOrder(a.position as StaffMember['position']) - getPositionOrder(b.position as StaffMember['position'])
        );

        const formattedStaff = sortedStaff.map(staff => ({
          id: staff.id,
          name: staff.name,
          department: staff.department,
          position: staff.position as 'principal' | 'vice_principal' | 'department_head' | 'staff',
          contact: staff.contact
        }))
        setStaffMembers(formattedStaff)
      } else {
        navigate('/staff-input')
      }
    } catch (error: any) {
      console.error('Error loading staff:', error)
      toast({
        title: "데이터 로드 실패",
        description: "교직원 데이터를 불러올 수 없습니다.",
        variant: "destructive",
      })
    } finally {
        setIsLoading(false);
    }
  }

  const generateOrganizationTree = () => {
    const members = [...staffMembers];
    const principal = members.find(s => s.position === 'principal');
    const vicePrincipals = members.filter(s => s.position === 'vice_principal');
    const departmentHeads = members.filter(s => s.position === 'department_head');
    const staff = members.filter(s => s.position === 'staff');

    const buildNode = (member: StaffMember): OrganizationNode => ({
      id: member.id,
      staff: member,
      children: [],
    });

    const headNodes = departmentHeads.map(dh => {
      const node = buildNode(dh);
      node.children = staff
        .filter(s => s.department === dh.department)
        .map(buildNode);
      return node;
    });

    const vicePrincipalNodes = vicePrincipals.map(vp => {
      const node = buildNode(vp);
      node.children = [...headNodes];
      return node;
    });

    let tree: OrganizationNode[] = [];
    if (principal) {
      const principalNode = buildNode(principal);
      principalNode.children = vicePrincipalNodes.length > 0 ? vicePrincipalNodes : headNodes;
      tree = [principalNode];
    } else if (vicePrincipals.length > 0) {
      tree = vicePrincipalNodes;
    } else {
      tree = headNodes;
    }
    
    setOrganizationTree(tree);
  };

  const getNodeBgColor = (position: StaffMember['position']) => {
    switch(position) {
      case 'principal': return 'bg-gradient-primary text-white border-blue-500';
      case 'vice_principal': return 'bg-blue-50 border-blue-300';
      case 'department_head': return 'bg-green-50 border-green-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const getNodeLabelColor = (position: StaffMember['position']) => {
     switch(position) {
      case 'principal': return 'bg-white/20 text-white';
      case 'vice_principal': return 'bg-blue-100 text-blue-700';
      case 'department_head': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
  
  const renderOrganizationNode = (node: OrganizationNode) => (
    <li key={node.id}>
      <Card className={`node-card shadow-md border-2 min-w-[200px] ${getNodeBgColor(node.staff.position)}`}>
        <CardContent className="p-3 text-center">
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getNodeLabelColor(node.staff.position)}`}>
            {POSITION_LABELS[node.staff.position]}
          </div>
          <h3 className={`font-bold text-sm mb-1 ${node.staff.position === 'principal' ? 'text-white' : 'text-gray-800'}`}>
            {node.staff.name}
          </h3>
          <p className={`text-xs ${node.staff.position === 'principal' ? 'text-white/90' : 'text-gray-600'}`}>
            {node.staff.department}
          </p>
          <p className={`text-xs mt-1 ${node.staff.position === 'principal' ? 'text-white/80' : 'text-gray-500'}`}>
            {node.staff.contact}
          </p>
        </CardContent>
      </Card>
      
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map(child => renderOrganizationNode(child))}
        </ul>
      )}
    </li>
  )

  const handleSaveLayout = async () => { /* ... */ };
  const handlePrint = () => { window.print() };
  const handleDownloadImage = async () => { /* ... */ };
  const handleGenerateShareLink = async () => { /* ... */ };
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

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
          <div className="flex-1 relative">
            <TransformWrapper
                initialScale={1}
                minScale={0.2}
                maxScale={3}
                limitToBounds={false}
                centerOnInit
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="mb-6 print:hidden">
                            <div className="flex flex-wrap gap-3 justify-between items-center">
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
                                        {copySuccess ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <Share2 className="h-4 w-4 mr-2" />}
                                        {copySuccess ? '복사됨!' : '링크 공유'}
                                    </Button>
                                </div>
                                <Controls
                                    zoomIn={zoomIn}
                                    zoomOut={zoomOut}
                                    resetTransform={resetTransform}
                                />
                            </div>
                        </div>
                        <TransformComponent
                            wrapperStyle={{ width: '100%', height: 'calc(100vh - 250px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                            contentStyle={{ width: '100%', height: '100%' }}
                        >
                            <div ref={orgChartRef} className="bg-white rounded-lg p-6 h-full w-full">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-education-primary mb-2">
                                        {user?.user_metadata?.school_name || '학교'} 비상연락망
                                    </h2>
                                    <p className="text-education-neutral">
                                        생성일: {new Date().toLocaleDateString()}
                                    </p>
                                </div>

                                {organizationTree.length > 0 ? (
                                    <div className="flex justify-center items-center h-full">
                                      <ul className="org-chart">
                                          {organizationTree.map((node) => renderOrganizationNode(node))}
                                      </ul>
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
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
          </div>
          <div className="lg:w-80 print:hidden">
            <Card className="shadow-medium">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-education-primary mb-4">사용 방법</h3>
                    <div className="space-y-3 text-sm text-education-neutral">
                        <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-education-primary rounded-full mt-2 flex-shrink-0"></div>
                            <p>마우스 휠 또는 컨트롤 버튼으로 조직도를 확대/축소할 수 있습니다.</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-education-secondary rounded-full mt-2 flex-shrink-0"></div>
                            <p>마우스로 드래그하여 조직도를 이동할 수 있습니다.</p>
                        </div>
                        <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-education-primary rounded-full mt-2 flex-shrink-0"></div>
                            <p>인쇄 또는 이미지로 다운로드할 수 있습니다.</p>
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
      <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              margin: 1cm;
              size: A4 landscape;
            }
            .print\\:hidden { display: none !important; }
            body { background: white !important; }
            .org-chart {
                transform: scale(0.7);
                transform-origin: top left;
            }
          }
      `}} />
    </div>
  )
}
