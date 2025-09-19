import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import {
  Network,
  Printer,
  Download,
  Edit3,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- 타입 정의 ---
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

// --- 메인 페이지 컴포넌트 ---
export const EmergencyNetworkPage = () => {
  const [organizationTree, setOrganizationTree] = useState<OrganizationNode[]>([])
  const [user, setUser] = useState<any>(null)
  const orgChartRef = useRef<HTMLDivElement>(null)
  const transformWrapperRef = useRef<any>(null);
  
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUser(user);
      loadStaffData(user.id);
    };
    checkUserAndLoadData();
  }, [navigate]);

  const loadStaffData = async (userId: string) => {
    try {
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('*')
        .eq('school_id', userId);

      if (error) throw error;

      if (staffData && staffData.length > 0) {
        generateOrganizationTree(staffData);
      } else {
        navigate('/staff-input');
      }
    } catch (error: any) {
      toast({
        title: "데이터 로드 실패",
        description: "교직원 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const generateOrganizationTree = (staffData: any[]) => {
    const sortedStaff = staffData.sort((a, b) => 
      getPositionOrder(a.position as StaffMember['position']) - getPositionOrder(b.position as StaffMember['position'])
    );
    
    const members: StaffMember[] = sortedStaff;
    const buildNode = (member: StaffMember): OrganizationNode => ({ id: member.id, staff: member, children: [] });
    
    const principal = members.find(s => s.position === 'principal');
    const vicePrincipals = members.filter(s => s.position === 'vice_principal');
    const departmentHeads = members.filter(s => s.position === 'department_head');
    const staff = members.filter(s => s.position === 'staff');
    
    const headNodes = departmentHeads.map(dh => {
      const node = buildNode(dh);
      node.children = staff.filter(s => s.department === dh.department).map(buildNode);
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
    } else {
      tree = vicePrincipalNodes.length > 0 ? vicePrincipalNodes : headNodes;
    }
    setOrganizationTree(tree);
  };

  const handlePrint = () => window.print();

  const handleDownloadImage = async () => {
    const element = orgChartRef.current;
    if (!element || !transformWrapperRef.current) return;

    const { resetTransform } = transformWrapperRef.current;
    resetTransform();
  
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        const link = document.createElement('a');
        link.download = `비상연락망_${new Date().toLocaleDateString().replace(/\s/g, '')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast({ title: "이미지 다운로드 성공" });
      } catch (error) {
        console.error("다운로드 실패:", error);
        toast({
          title: "다운로드 실패",
          description: "이미지를 생성하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }, 100);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
  };
  
  const renderOrganizationNode = (node: OrganizationNode) => {
    const hasChildren = node.children && node.children.length > 0;
    const useVerticalLayoutForChildren = node.staff.position === 'department_head';

    return (
      <li key={node.id}>
        <div className={`node-card ${hasChildren ? 'has-children' : ''}`}>
          <Card className={`shadow-md border-2 min-w-[200px] ${getNodeBgColor(node.staff.position)}`}>
            <CardContent className="p-3 text-center">
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getNodeLabelColor(node.staff.position)}`}>
                {POSITION_LABELS[node.staff.position]}
              </div>
              <h3 className={`font-bold text-sm mb-1 ${node.staff.position === 'principal' ? 'text-white' : 'text-gray-800'}`}>{node.staff.name}</h3>
              <p className={`text-xs ${node.staff.position === 'principal' ? 'text-white/90' : 'text-gray-600'}`}>{node.staff.department}</p>
              <p className={`text-xs mt-1 ${node.staff.position === 'principal' ? 'text-white/80' : 'text-gray-500'}`}>{node.staff.contact}</p>
            </CardContent>
          </Card>
        </div>
        
        {hasChildren && (
          <ul className={useVerticalLayoutForChildren ? 'is-vertical' : ''}>
            {node.children.map(child => renderOrganizationNode(child))}
          </ul>
        )}
      </li>
    )
  }

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
                    <Button variant="outline" onClick={() => navigate('/staff-input')}> <Edit3 className="h-4 w-4 mr-2" /> 직원 수정 </Button>
                    <Button variant="outline" onClick={handleLogout}> 로그아웃 </Button>
                </div>
            </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex-1 relative">
          <TransformWrapper ref={transformWrapperRef} initialScale={0.8} minScale={0.1} maxScale={3} limitToBounds={false} centerOnInit>
            {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="mb-6 print:hidden">
                    <div className="flex flex-wrap gap-3 justify-between items-center">
                      <div className="flex flex-wrap gap-3">
                          <Button variant="outline" onClick={handlePrint}> <Printer className="h-4 w-4 mr-2" /> 인쇄 </Button>
                          <Button variant="outline" onClick={handleDownloadImage}> <Download className="h-4 w-4 mr-2" /> 이미지 다운로드 </Button>
                      </div>
                      <div className="flex gap-2 p-2 rounded-md bg-white border shadow-md print:hidden">
                        <Button variant="outline" size="icon" onClick={() => zoomIn()} aria-label="Zoom In"> <ZoomIn className="h-4 w-4" /> </Button>
                        <Button variant="outline" size="icon" onClick={() => zoomOut()} aria-label="Zoom Out"> <ZoomOut className="h-4 w-4" /> </Button>
                        <Button variant="outline" size="icon" onClick={() => resetTransform()} aria-label="Reset Zoom"> <RotateCcw className="h-4 w-4" /> </Button>
                      </div>
                    </div>
                  </div>
                  <TransformComponent wrapperStyle={{ width: '100%', height: 'calc(100vh - 250px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                    <div ref={orgChartRef} className="bg-white rounded-lg p-6">
                        <div className="text-center mb-12">
                          <h2 className="text-3xl font-bold text-education-primary mb-2"> {user?.user_metadata?.school_name || '학교'} 비상연락망 </h2>
                          <p className="text-education-neutral"> 생성일: {new Date().toLocaleDateString()} </p>
                        </div>
                        {organizationTree.length > 0 ? (
                            <div className="flex justify-center items-start">
                              <ul className="org-chart">
                                  {organizationTree.map((node) => renderOrganizationNode(node))}
                              </ul>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                              <Users className="h-16 w-16 text-education-neutral/50 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-education-neutral mb-2"> 교직원 정보가 없습니다 </h3>
                              <p className="text-education-neutral/80 mb-6"> 먼저 교직원 정보를 입력해주세요. </p>
                              <Button onClick={() => navigate('/staff-input')} className="bg-gradient-primary hover:opacity-90"> 교직원 정보 입력하기 </Button>
                            </div>
                        )}
                    </div>
                  </TransformComponent>
                </>
              )}
          </TransformWrapper>
          <p className="text-center text-sm text-muted-foreground mt-2 print:hidden">(조직도를 마우스로 드래그하여 이동할 수 있습니다)</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .print\\:hidden { display: none !important; }
            body { background: white !important; }
            .org-chart { transform: scale(0.7); transform-origin: top left; }
          }
      `}} />
    </div>
  )
}
