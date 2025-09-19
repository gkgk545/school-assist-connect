import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Plus, Trash2, Users, Save, Upload, Download } from 'lucide-react' // Download 아이콘 추가
import * as XLSX from 'xlsx';

interface StaffMember {
  id: string
  name: string
  department: string
  position: 'principal' | 'vice_principal' | 'department_head' | 'staff'
  contact: string
}

const POSITION_LABELS: { [key in StaffMember['position']]: string } = {
  principal: '교장',
  vice_principal: '교감',
  department_head: '부서장',
  staff: '부원'
}

const KOREAN_TO_POSITION: { [key: string]: StaffMember['position'] } = {
  '교장': 'principal',
  '교감': 'vice_principal',
  '부서장': 자",
            "직위": "교장",
            "연락처": "02-111-2222"
        },
        {
            "이름": "박부장",
            "부서명": "연구부",
            "직위": "부서장",
            "연락처": "010-9876-5432"
        }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

    // 컬럼 너비 설정
    worksheet['!cols'] = [
        { wch: 15 }, // 이름
        { wch: 20 }, // 부서명
        { wch: 15 }, // 직위
        { wch: 20 }  // 연락처
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "교직원 목록");

    XLSX.writeFile(workbook, "교직원_입력_양식.xlsx");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      await supabase
        .from('staff')
        .delete()
        .eq('school_id', user.id)

      const staffData = staffMembers.map(({ id, ...member}) => ({
        school_id: user.id,
        ...member
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
        {/* ... Header JSX is unchanged ... */}
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className='flex items-center gap-2'>
              <h2 className="text-xl font-semibold">교직원 목록</h2>
              <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".xlsx, .xls"
                  onChange={handleExcelImport}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                  <Upload className="h-4 w-4 mr-2" />
                  엑셀 가져오기
              </Button>
              {/* --- 양식 다운로드 버튼 추가 --- */}
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                  <Download className="h-4 w-4 mr-2" />
                  양식 다운로드
              </Button>
            </div>
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
            {/* ... Staff member card mapping is unchanged ... */}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            {/* ... Footer buttons are unchanged ... */}
          </div>
        </form>
      </main>
    </div>
  )
}
