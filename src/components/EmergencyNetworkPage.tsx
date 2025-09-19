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
  Share2,
  Edit3,
  Users,
  Copy,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from 'react-beautiful-dnd';

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
const Controls = ({ zoomIn, zoomOut, resetTransform }: { zoomIn: () => void, zoomOut: () => void, resetTransform: () => void }) => {
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

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/')
      return
    }
    setUser(user)
    loadData(user.id)
  }

  const loadData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: layoutData } = await supabase
        .from('organization_layouts')
        .select('layout_data')
        .eq('school_id', userId)
        .single();

      if (layoutData?.layout_data) {
        setOrganizationTree((layoutData.layout_data as any).tree);
      } else {
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('school_id', userId);

        if (staffError) throw staffError;

        if (staffData && staffData.length > 0) {
          generateInitialTree(staffData);
        } else {
          navigate('/staff-input');
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({ title: "데이터 로드 실패", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false);
    }
  }
  
  const generateInitialTree = (staffData: any[]) => {
    const sortedStaff = staffData.sort((a, b) => 
      getPositionOrder(a.position as StaffMember['position']) - getPositionOrder(b.position as StaffMember['position'])
    );

    const members: StaffMember[] = sortedStaff.map(staff => ({
      id: staff.id,
      name: staff.name,
      department: staff.department,
      position: staff.position,
      contact: staff.contact
    }));

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

  const autoSaveLayout = async (newTree: OrganizationNode[]) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('organization_layouts')
        .upsert({ school_id: user.id, layout_data: { tree: newTree } }, { onConflict: 'school_id' });
      if (error) throw error;
      toast({ title: "레이아웃 자동 저장됨", description: "변경사항이 저장되었습니다." });
    } catch (error: any) {
      toast({ title: "자동 저장 실패", description: error.message, variant: "destructive" });
    }
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const newTree = JSON.parse(JSON.stringify(organizationTree));

    // 재귀적으로 노드를 찾고, 부모 리스트와 인덱스를 반환하는 함수
    const findNodeAndParent = (nodes: OrganizationNode[], id: string): { list: OrganizationNode[], index: number } | null => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
          return { list: nodes, index: i };
        }
        const found = findNodeAndParent(nodes[i].children, id);
        if (found) return found;
      }
      return null;
    }

    // 재귀적으로 Droppable ID를 가진 노드를 찾는 함수
    const findParentNode = (nodes: OrganizationNode[], droppableId: string): OrganizationNode[] | null => {
        for(const node of nodes) {
            if (node.id === droppableId) return node.children;
            const found = findParentNode(node.children, droppableId);
            if(found) return found;
        }
        return null;
    }
    
    // 부서장 또는 교감의 자식 목록을 직접 찾음 (최상위 레벨 드래그)
    let sourceList: OrganizationNode[] | null = null;
    if(source.droppableId === "root-droppable") {
      sourceList = newTree[0]?.children[0]?.children || newTree[0]?.children;
    } else {
      sourceList = findParentNode(newTree, source.droppableId);
    }

    if (!sourceList) return;

    const [movedItem] = sourceList.splice(source.index, 1);
    
    let destinationList: OrganizationNode[] | null = null;
    if(destination.droppableId === "root-droppable") {
        destinationList = newTree[0]?.children[0]?.children || newTree[0]?.children;
    } else {
        destinationList = findParentNode(newTree, destination.droppableId);
    }

    if (!destinationList) return;

    destinationList.splice(destination.index, 0, movedItem);

    setOrganizationTree(newTree);
    autoSaveLayout(newTree);
  };
  
  const handlePrint = () => window.print();
  
  const handleDownloadImage = async () => {
    if (!orgChartRef.current) return;
    try {
      const canvas = await html2canvas(orgChartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = `비상연락망_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast({ title: "이미지 다운로드 성공" });
    } catch (error) {
      toast({ title: "다운로드 실패", description: "이미지를 다운로드하는 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      const shareId = user?.id;
      if (!shareId) throw new Error("사용자 ID를 찾을 수 없습니다.");

      await autoSaveLayout(organizationTree);
      
      const url = `${window.location.origin}/share/${shareId}`;
      await navigator.clipboard.writeText(url);
      setShareUrl(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({ title: "공유 링크가 클립보드에 복사되었습니다." });
    } catch (error: any) {
      toast({ title: "링크 생성 실패", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  
  const getNodeBgColor = (position: StaffMember['position']) => { /* ... */ return 'bg-gray-50 border-gray-300'; };
  const getNodeLabelColor = (position: StaffMember['position']) => { /* ... */ return 'bg-gray-100 text-gray-700'; };
  
  const renderNode = (node: OrganizationNode, index: number, isDraggable: boolean) => {
    const card = (
      <Card className={`node-card shadow-md border-2 min-w-[200px] ${getNodeBgColor(node.staff.position)}`}>
        <CardContent className="p-3 text-center">
          <div className="flex justify-center items-center">
            {isDraggable && <Move className="h-3 w-3 mr-2 text-gray-400" />}
            <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getNodeLabelColor(node.staff.position)}`}>
              {POSITION_LABELS[node.staff.position]}
            </div>
          </div>
          <h3 className={`font-bold text-sm mb-1`}>{node.staff.name}</h3>
          <p className={`text-xs`}>{node.staff.department}</p>
          <p className={`text-xs mt-1`}>{node.staff.contact}</p>
        </CardContent>
      </Card>
    );

    if (!isDraggable) return <div>{card}</div>;
    
    return (
      <Draggable draggableId={node.id} index={index}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
            {card}
          </div>
        )}
      </Draggable>
    );
  };
  
  const renderTree = (nodes: OrganizationNode[], parentDroppableId: string) => {
    const isDeptHeadList = nodes[0]?.staff.position === 'department_head';
    const isStaffList = nodes[0]?.staff.position === 'staff';

    const isDroppable = isDeptHeadList || isStaffList;
    const direction = isStaffList ? 'vertical' : 'horizontal';

    const listContent = (
      <ul className={isStaffList ? 'is-vertical' : ''}>
        {nodes.map((node, index) => (
          <li key={node.id}>
            {renderNode(node, index, isDroppable)}
            {node.children.length > 0 && renderTree(node.children, node.id)}
          </li>
        ))}
      </ul>
    );
    
    if(!isDroppable) return listContent;

    return (
      <Droppable droppableId={parentDroppableId} direction={direction}>
        {(provided) => (
          <ul ref={provided.innerRef} {...provided.droppableProps} className={isStaffList ? 'is-vertical' : ''}>
            {nodes.map((node, index) => (
              <li key={node.id}>
                {renderNode(node, index, true)}
                {node.children.length > 0 && renderTree(node.children, node.id)}
              </li>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-soft border-b print:hidden">
        {/* Header content... */}
      </header>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex-1 relative">
            <TransformWrapper initialScale={0.8} minScale={0.2} maxScale={3} limitToBounds={false} centerOnInit>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="mb-6 print:hidden">
                    <div className="flex flex-wrap gap-3 justify-between items-center">
                      <div className="flex flex-wrap gap-3">
                          <Button variant="outline" onClick={handlePrint}> <Printer className="h-4 w-4 mr-2" /> 인쇄 </Button>
                          <Button variant="outline" onClick={handleDownloadImage}> <Download className="h-4 w-4 mr-2" /> 이미지 다운로드 </Button>
                          <Button variant="outline" onClick={handleGenerateShareLink}>
                              {copySuccess ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <Share2 className="h-4 w-4 mr-2" />}
                              {copySuccess ? '복사됨!' : '링크 공유'}
                          </Button>
                      </div>
                      <Controls zoomIn={zoomIn} zoomOut={zoomOut} resetTransform={resetTransform} />
                    </div>
                  </div>
                  <TransformComponent wrapperStyle={{ width: '100%', height: 'calc(100vh - 250px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} contentStyle={{ width: '100%', height: '100%' }}>
                    <div ref={orgChartRef} className="bg-white rounded-lg p-6 h-full w-full">
                        <div className="text-center mb-8">
                          {/* Title content... */}
                        </div>

                        {organizationTree.length > 0 ? (
                            <div className="flex justify-center items-start pt-8">
                              <ul className="org-chart">
                                {organizationTree.map((node, index) => (
                                    <li key={node.id}>
                                        {renderNode(node, index, false)}
                                        {node.children.length > 0 && renderTree(node.children, node.children[0]?.staff.position === "vice_principal" ? node.id : "root-droppable" )}
                                    </li>
                                ))}
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
              )}
            </TransformWrapper>
            <p className="text-center text-sm text-muted-foreground mt-2 print:hidden">(조직도를 마우스로 드래그하여 이동할 수 있습니다)</p>
          </div>
        </div>
      </DragDropContext>

      <style dangerouslySetInnerHTML={{ __html: `
          @media print { /* ... Print styles ... */ }
      `}} />
    </div>
  )
}
