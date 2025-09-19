import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

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

// --- 확대/축소 컨트롤 컴포넌트 ---
const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
    return (
        <div className="flex gap-2 p-2 rounded-md bg-white border shadow-md print:hidden">
            <Button variant="outline" size="icon" onClick={() => zoomIn()} aria-label="Zoom In"> <ZoomIn className="h-4 w-4" /> </Button>
            <Button variant="outline" size="icon" onClick={() => zoomOut()} aria-label="Zoom Out"> <ZoomOut className="h-4 w-4" /> </Button>
            <Button variant="outline" size="icon" onClick={() => resetTransform()} aria-label="Reset Zoom"> <RotateCcw className="h-4 w-4" /> </Button>
        </div>
    );
};

// --- 메인 페이지 컴포넌트 ---
export const EmergencyNetworkPage = () => {
  const [organizationTree, setOrganizationTree] = useState<OrganizationNode[]>([])
  const [user, setUser] = useState<any>(null)
  const orgChartRef = useRef<HTMLDivElement>(null)
  const transformControlsRef = useRef<{ resetTransform: () => void } | null>(null);
  
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
    if (!element || !transformControlsRef.current?.resetTransform) return;
  
    const { resetTransform } = transformControlsRef.current;
    
    // 캡처 전에 화면을 초기 상태로 리셋
    resetTransform();
  
    // 제목(h2)과 부제목(p) 요소 찾기
    const titleElement = element.querySelector('.org-title') as HTMLElement | null;
    const subtitleElement = element.querySelector('.org-subtitle') as HTMLElement | null;
    const originalTitleStyle = titleElement ? titleElement.style.cssText : '';
    const originalSubtitleStyle = subtitleElement ? subtitleElement.style.cssText : '';
  
    // 캡처를 위해 스타일 임시 변경
    if (titleElement) titleElement.style.transform = 'scale(1)';
    if (subtitleElement) subtitleElement.style.transform = 'scale(1)';
  
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
      } finally {
        // 원래 스타일로 복원
        if (titleElement) titleElement.style.cssText = originalTitleStyle;
        if (subtitleElement) subtitleElement.style.cssText = originalSubtitleStyle;
      }
    }, 100);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  
  const getNodeBgColor = (position: StaffMember['position']) => {
    // ... getNodeBgColor 로직
  };

  const getNodeLabelColor = (position: StaffMember['position']) => {
    // ... getNodeLabelColor 로직
  };
  
  const renderOrganizationNode = (node: OrganizationNode) => {
    // ... renderOrganizationNode 로직
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft border-b print:hidden">
        {/* Header content... */}
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex-1 relative">
          <TransformWrapper initialScale={0.8} minScale={0.1} maxScale={3} limitToBounds={false} centerOnInit>
            {(props) => {
              transformControlsRef.current = { resetTransform: props.resetTransform };
              return (
                <>
                  <div className="mb-6 print:hidden">
                    <div className="flex flex-wrap gap-3 justify-between items-center">
                      <div className="flex flex-wrap gap-3">
                          <Button variant="outline" onClick={handlePrint}> <Printer className="h-4 w-4 mr-2" /> 인쇄 </Button>
                          <Button variant="outline" onClick={handleDownloadImage}> <Download className="h-4 w-4 mr-2" /> 이미지 다운로드 </Button>
                          {/* 링크 공유 버튼 제거됨 */}
                      </div>
                      <Controls />
                    </div>
                  </div>
                  <TransformComponent wrapperStyle={{ width: '100%', height: 'calc(100vh - 250px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                    <div ref={orgChartRef} className="bg-white rounded-lg p-6">
                        <div className="text-center mb-12">
                          <h2 className="org-title text-3xl font-bold text-education-primary mb-2"> {user?.user_metadata?.school_name || '학교'} 비상연락망 </h2>
                          <p className="org-subtitle text-education-neutral"> 생성일: {new Date().toLocaleDateString()} </p>
                        </div>
                        {organizationTree.length > 0 ? (
                            <div className="flex justify-center items-start">
                              <ul className="org-chart">
                                  {organizationTree.map((node) => renderOrganizationNode(node))}
                              </ul>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                              {/* Fallback content... */}
                            </div>
                        )}
                    </div>
                  </TransformComponent>
                </>
              );
            }}
          </TransformWrapper>
          <p className="text-center text-sm text-muted-foreground mt-2 print:hidden">(조직도를 마우스로 드래그하여 이동할 수 있습니다)</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          @media print { /* ... Print styles ... */ }
      `}} />
    </div>
  )
}
