import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useScheduleApi, ScheduleItem } from '../../hooks/useScheduleApi';
import ScheduleEditModal from './ScheduleEditModal';
import ScheduleForm from './ScheduleForm';
import { Clock, MapPin, MessageSquare, Tag, Edit2, Trash2, GripVertical, Calendar, BarChart3 } from 'lucide-react';

interface ScheduleDisplayProps {
  selectedDate: Date;
  initialPlaceName?: string;
  defaultCategory?: string;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ selectedDate, initialPlaceName, defaultCategory }) => {
  const { t, i18n } = useTranslation();
  const { 
    getSchedulesForDate, 
    addSchedule, 
    deleteSchedule, 
    updateSchedule, 
    moveSchedule, 
    reorderSchedules,
    loadSchedulesForDate,
    loading,
    error 
  } = useScheduleApi();
  const allSchedules = getSchedulesForDate(selectedDate) || [];
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 모든 스케줄 표시
  const schedules = allSchedules || [];

  // PNG/JPG 이미지 생성 (캔버스 렌더링)
  const renderImage = async (format: 'png' | 'jpg') => {
    const grouped = collectSchedules();
    const padding = 20;
    const rowHeight = 24;
    const dateHeaderHeight = 28;
    const width = 1200;
    const rowsCount = grouped.reduce((acc, g) => acc + Math.max(1, (g.rows ? g.rows.length : 0)) + 1, 0); // +1 for spacing
    const height = padding * 2 + rowsCount * rowHeight + grouped.length * (dateHeaderHeight - rowHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.max(300, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillText(`스케줄 내보내기 (${rangeStart} ~ ${rangeEnd})`, padding, padding + 6);

    let y = padding + 24;
    ctx.font = 'bold 16px system-ui, -apple-system, Segoe UI, Roboto';
    grouped.forEach(({ date, rows }) => {
      // Date header
      y += 10;
      ctx.fillStyle = '#1f2937';
      ctx.fillText(date, padding, y);
      y += 6;
      // table header
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.fillStyle = '#374151';
      const headers = ['번호', '시작', '종료', '진행 상황', '비고'];
      const colsX = [padding, padding + 60, padding + 140, padding + 220, padding + 620];
      headers.forEach((h, i) => ctx.fillText(h, colsX[i], y + 14));
      y += rowHeight;

      const ensureRows = (rows && rows.length > 0) ? rows : [];
      if ((rows ? rows.length : 0) === 0) {
        // empty row marker
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText('데이터 없음', colsX[0], y + 14);
        y += rowHeight;
      } else {
        ensureRows.forEach((r, idx) => {
          ctx.fillStyle = '#111827';
          const values = [String(idx + 1), r.startTime ?? '', r.endTime ?? '', r.googleApiData ?? '', r.remarks ?? ''];
          values.forEach((v, i) => {
            const text = String(v).replace(/\n/g, ' ');
            ctx.fillText(text, colsX[i], y + 14);
          });
          y += rowHeight;
        });
      }
    });

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.92;
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `schedules_${rangeStart}_to_${rangeEnd}.${format}`);
    }, mime, quality);
  };


  // selectedDate가 변경될 때마다 해당 날짜의 스케줄 로드
  useEffect(() => {
    loadSchedulesForDate(selectedDate);
  }, [selectedDate, loadSchedulesForDate]);


  // selectedDate가 변경될 때마다 하이라이트 효과 재적용
  useEffect(() => {
    setIsHighlighted(true);
    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, 2000); // 2초 후 하이라이트 효과 제거

    return () => clearTimeout(timer);
  }, [selectedDate]);

  // selectedDate가 변경될 때마다 날짜 범위도 업데이트
  useEffect(() => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setRangeStart(dateString);
    setRangeEnd(dateString);
  }, [selectedDate]);


  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 시간 차이 계산 함수
  const calculateDuration = (startTime: string, endTime: string): string => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes < 60) {
      return `${durationMinutes}분`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      if (minutes === 0) {
        return `${hours}시간`;
      } else {
        return `${hours}시간 ${minutes}분`;
      }
    }
  };

  const handleAddSchedule = async (scheduleData: any) => {
    try {
      const scheduleItem: Omit<ScheduleItem, 'id'> = {
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        title: scheduleData.title || scheduleData.googleApiData || '', // 제목 폴백 보장
        googleApiData: scheduleData.googleApiData,
        remarks: scheduleData.remarks || '',
        order: 0, // 기본값
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addSchedule(selectedDate, scheduleItem);
      } catch (err) {
        console.error('Failed to add schedule:', err);
    }
  };


  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(selectedDate, id);
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };

  const handleEditSchedule = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (schedule: ScheduleItem) => {
    try {
      await updateSchedule(selectedDate, schedule.id, {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        title: schedule.title,
        googleApiData: schedule.googleApiData,
        remarks: schedule.remarks
      });
      setEditingSchedule(null);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update schedule:', err);
    }
  };

  // 드래그&드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, index: number) => {
    console.log('드래그 시작:', index);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    console.log('드롭 이벤트:', { draggedIndex, dropIndex });
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      try {
        console.log('순서 변경 시작:', { from: draggedIndex, to: dropIndex });
        // 시간은 고정하고 내용(순서)만 바뀌는 방식
        await reorderSchedules(selectedDate, draggedIndex, dropIndex);
        console.log('순서 변경 완료');
      } catch (err) {
        console.error('순서 변경 실패:', err);
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 이동 버튼 핸들러
  const handleMoveUp = async (scheduleId: string) => {
    try {
      await moveSchedule(selectedDate, scheduleId, 'up');
    } catch (err) {
      console.error('Failed to move schedule up:', err);
    }
  };

  const handleMoveDown = async (scheduleId: string) => {
    try {
      await moveSchedule(selectedDate, scheduleId, 'down');
    } catch (err) {
      console.error('Failed to move schedule down:', err);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(i18n.language || 'ko', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
  };

  // 카테고리별 색상 매핑 - Home/Login 톤 유지
  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      '관광': 'bg-blue-50 text-blue-700 border-blue-200',
      '식사': 'bg-green-50 text-green-700 border-green-200',
      '쇼핑': 'bg-purple-50 text-purple-700 border-purple-200',
      '교통': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      '숙박': 'bg-pink-50 text-pink-700 border-pink-200',
      '문화시설': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      '기타': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colorMap[category] || colorMap['기타'];
  };

  // 일정 통계 계산
  const totalSchedules = (allSchedules || []).length;
  const totalDuration = (allSchedules || []).reduce((total, schedule) => {
    const start = new Date(`2000-01-01 ${schedule.startTime}`);
    const end = new Date(`2000-01-01 ${schedule.endTime}`);
    return total + (end.getTime() - start.getTime());
  }, 0);
  
  const formatDuration = (ms: number, t?: any) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if ((i18n.language || 'ko').startsWith('en')) {
      // English compact
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return hours > 0 ? `${hours}${t('hours')} ${minutes}${t('minutes')}` : `${minutes}${t('minutes')}`;
  };

  // 다운로드/공유: 날짜 범위 선택 상태 (기간 선택 제거로 단일 날짜 사용)
  const [rangeStart, setRangeStart] = useState<string>(() => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const [rangeEnd, setRangeEnd] = useState<string>(() => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });

  const enumerateDates = (startISO: string, endISO: string): Date[] => {
    // UTC 시간으로 처리하여 시간대 문제 방지
    const start = new Date(startISO + 'T00:00:00.000Z');
    const end = new Date(endISO + 'T00:00:00.000Z');
    const days: Date[] = [];
    const cur = new Date(start);
    
    // 같은 날짜일 때도 포함되도록 처리
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    
    // 시작일과 종료일이 같은 경우에도 해당 날짜가 포함되도록 보장
    if (days.length === 0) {
      days.push(new Date(start));
    }
    
    return days;
  };

  const collectSchedules = () => {
    const days = enumerateDates(rangeStart, rangeEnd);
    const out: Array<{ date: string; rows: ScheduleItem[] }> = [];
    for (const d of days) {
      // 로컬 날짜로 변환하여 정확한 날짜 사용
      const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dateString = localDate.toISOString().substring(0, 10);
      out.push({ date: dateString, rows: getSchedulesForDate(localDate) || [] });
    }
    return out;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Excel(CSV) 생성
  const handleDownloadCSV = () => {
    const grouped = collectSchedules();
    const header = ['날짜', '번호', '시작', '종료', '진행 상황', '비고'];
    const lines: string[] = [];
    lines.push('\uFEFF' + header.join(',')); // BOM for Excel
    grouped.forEach(({ date, rows }) => {
      const safeRows = rows || [];
      safeRows.forEach((row, idx) => {
        const cols = [
          date,
          String(idx + 1),
          row.startTime ?? '',
          row.endTime ?? '',
          (row.googleApiData ?? '').replace(/[,\n]/g, ' '),
          (row.remarks ?? '').replace(/[,\n]/g, ' '),
        ];
        lines.push(cols.join(','));
      });
      if ((rows ? rows.length : 0) === 0) {
        lines.push([date, '0', '', '', '', ''].join(','));
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `schedules_${rangeStart}_to_${rangeEnd}.csv`);
  };


  const handleShare = async () => {
    // 기본적으로 CSV를 만들어 공유 시도
    const grouped = collectSchedules();
    const header = ['날짜', '번호', '시작', '종료', '진행 상황', '비고'];
    const lines: string[] = [];
    lines.push('\uFEFF' + header.join(','));
    grouped.forEach(({ date, rows }) => {
      rows.forEach((row, idx) => {
        const cols = [
          date,
          String(idx + 1),
          row.startTime ?? '',
          row.endTime ?? '',
          (row.googleApiData ?? '').replace(/[,\n]/g, ' '),
          (row.remarks ?? '').replace(/[,\n]/g, ' '),
        ];
        lines.push(cols.join(','));
      });
      if ((rows ? rows.length : 0) === 0) lines.push([date, '0', '', '', '', ''].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });

    // Web Share API (파일 공유 지원 시)
    // @ts-ignore
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [] })) {
      const file = new File([blob], `schedules_${rangeStart}_to_${rangeEnd}.csv`, { type: 'text/csv' });
      try {
        // @ts-ignore
        await navigator.share({ files: [file], title: '스케줄 공유', text: '스케줄 파일을 공유합니다.' });
        return;
      } catch (e) {
        // fallthrough to download
      }
    }
    downloadBlob(blob, `schedules_${rangeStart}_to_${rangeEnd}.csv`);
  };

  return (
    <div className="p-6">
      {/* 헤더 - Home/Login 톤 유지 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
        {t('scheduleManagement')}
      </h2>
        
        {/* 통계 정보 */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{totalSchedules}{t('scheduleCount')}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span>{formatDuration(totalDuration, t)}</span>
          </div>
        </div>
      </div>
      {/* 다운로드/공유 바 - 가로로 펼치기 */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={handleDownloadCSV} className="btn btn-sm btn-outline">📊 {t('excelDownload')}</button>
          <button onClick={() => renderImage('png')} className="btn btn-sm btn-outline">🖼️ {t('pngDownload')}</button>
          <button onClick={() => renderImage('jpg')} className="btn btn-sm btn-outline">📷 {t('jpgDownload')}</button>
          <button onClick={handleShare} className="btn btn-sm btn-outline">🔗 {t('share')}</button>
        </div>
      </div>
      
      {/* 선택된 날짜 표시 - Home/Login과 동일한 스타일 적용 */}
      <div className={`mb-6 p-4 rounded-md border transition-all duration-200 ${
        isHighlighted 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          {formatDate(selectedDate)} {t('scheduleStatus')}
        </h3>
      </div>

      {/* 로딩 및 에러 상태 */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{t('loadingSchedule')}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">{t('errorOccurred')}</p>
          <p>{error}</p>
        </div>
      )}

      {/* 스케줄 타임라인 디자인 */}
      <div className="space-y-4">
        {/* 표시 개수 선택 */}

        {/* 일정 타임라인 */}
        {schedules.length > 0 ? (
          <div className="relative">
            {/* 타임라인 라인 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
            
            <div className="space-y-6">
              {schedules.map((schedule, index) => (
                <div
                  key={schedule.id} 
                  className={`relative flex items-start gap-6 ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  } ${
                    dragOverIndex === index ? 'transform scale-105' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  title="드래그하여 순서 변경"
                >
                  {/* 타임라인 노드 */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200 dark:border-gray-600">
                      <Clock className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>

                  {/* 스케줄 카드 */}
                  <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="p-6">
                      {/* 헤더 - 시간대, 액션 버튼, 드래그 핸들 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold text-sm">
                              {schedule.startTime} - {schedule.endTime}
                            </span>
                          </div>
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {calculateDuration(schedule.startTime, schedule.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* 액션 버튼들 */}
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-200"
                            title="편집"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>편집</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>삭제</span>
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move hover:text-gray-600" />
                        </div>
                      </div>

                      {/* 메인 콘텐츠 */}
                      <div className="space-y-3">
                        {/* 장소/활동명 */}
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                              {schedule.title || schedule.googleApiData || '제목 없음'}
                            </h3>
                          </div>
                        </div>

                        {/* 메모 */}
                        {schedule.remarks && (
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {schedule.remarks}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
            ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">{t('noSchedule')}</p>
            <p className="text-sm">{t('addNewSchedule')}</p>
              </div>
            )}
          </div>

      {/* 새 스케줄 추가 폼 - ScheduleForm 컴포넌트 사용 */}
      <div className="mt-6">
        <ScheduleForm
          onSubmit={handleAddSchedule}
          defaultValue={{
            googleApiData: initialPlaceName || ''
          }}
          defaultCategory={defaultCategory}
          compact={false}
        />
      </div>


      {/* 편집 모달 */}
      <ScheduleEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ScheduleDisplay;