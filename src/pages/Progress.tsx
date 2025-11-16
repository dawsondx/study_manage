import { useState, useEffect } from 'react';
import { useResourceStore, useProgressStore } from '@/stores';
import { DataFormatter, StudyCalculator } from '@/utils';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Square,
  Clock,
  Target,
  Award,
  BookOpen,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Resource } from '@/types';

export default function Progress() {
  const { resources } = useResourceStore();
  const { 
    currentSession, 
    startStudySession, 
    endStudySession,
    pauseStudySession,
    resumeStudySession,
    studyRecords,
    getResourceProgress,
    getStudyStatistics,
    getCurrentSessionDuration
  } = useProgressStore();

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionProgress, setSessionProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 更新计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession) {
      setElapsedTime(getCurrentSessionDuration() * 1000);
      interval = setInterval(() => {
        setElapsedTime(getCurrentSessionDuration() * 1000);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession, getCurrentSessionDuration]);

  useEffect(() => {
    if (currentSession) {
      const res = resources.find(r => r.id === currentSession.resourceId) || null;
      setSelectedResource(res);
      setSessionProgress(res ? res.progress : 0);
    }
  }, [currentSession, resources]);

  // 可学习的资源（未开始和进行中的）
  const studyableResources = resources.filter(r => 
    r.status === 'not_started' || r.status === 'in_progress'
  );

  // 最近学习记录
  const recentRecords = studyRecords
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 10);

  const handleStartSession = (resource: Resource) => {
    if (currentSession) {
      toast.error('请先结束当前学习会话');
      return;
    }
    setSelectedResource(resource);
    setSessionProgress(resource.progress);
    startStudySession(resource.id);
    toast.success(`开始学习: ${resource.title}`);
  };

  const handleEndSession = () => {
    if (!currentSession) return;

    endStudySession(sessionNotes, sessionProgress);
    
    if (sessionProgress === 100) {
      const { updateResource } = useResourceStore.getState();
      updateResource(currentSession.resourceId, { 
        status: 'completed',
        completedDate: new Date()
      });
      toast.success('恭喜完成学习！');
    }

    setSelectedResource(null);
    setSessionNotes('');
    setElapsedTime(0);
    toast.success('学习会话已结束');
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getResourceStats = (resourceId: string) => {
    const records = getResourceProgress(resourceId);
    const stats = getStudyStatistics(resourceId);
    return { records, stats };
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">学习进度</h1>
        {currentSession && (
          <div className="flex items-center space-x-4 bg-blue-50 px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-700 font-medium">学习中</span>
            </div>
            <span className="text-blue-600 font-mono text-lg">
              {formatTime(elapsedTime)}
            </span>
          </div>
        )}
      </div>

      {/* 当前学习会话 */}
      {currentSession && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedResource?.title || '当前学习'}</h3>
                <p className="text-sm text-gray-500">{selectedResource?.resourceType || ''}</p>
              </div>
            </div>
            <button
              onClick={handleEndSession}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4 mr-2" />
              结束学习
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 学习时间 */}
            <div className="text-center">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatTime(elapsedTime)}</p>
              <p className="text-sm text-gray-500">本次学习时长</p>
            </div>

            {/* 当前进度 */}
            <div className="text-center">
              <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{sessionProgress}%</p>
              <p className="text-sm text-gray-500">当前进度</p>
            </div>

            {/* 预计剩余 */}
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{100 - sessionProgress}%</p>
              <p className="text-sm text-gray-500">剩余进度</p>
            </div>
          </div>

          {/* 进度调整 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              更新学习进度 ({sessionProgress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={sessionProgress}
              onChange={(e) => setSessionProgress(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${sessionProgress}%` }}
              ></div>
            </div>
          </div>

          {/* 暂停 / 继续 */}
          <div className="mt-6">
            <button
              onClick={() => currentSession?.isPaused ? resumeStudySession() : pauseStudySession()}
              className={`${currentSession?.isPaused ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} inline-flex items-center px-4 py-2 rounded-lg transition-colors`}
            >
              {currentSession?.isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {currentSession?.isPaused ? '继续' : '暂停'}
            </button>
          </div>

          {/* 学习笔记 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              学习笔记
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="记录今天的学习心得..."
            />
          </div>
        </div>
      )}

      {/* 可学习资源 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">可学习资源</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studyableResources.map((resource) => {
            const { stats } = getResourceStats(resource.id);
            return (
              <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug min-h-[2.5rem] sm:min-h-[3rem] max-h-[2.5rem] sm:max-h-[3rem] overflow-hidden">{resource.title}</h3>
                    <p className="text-sm text-gray-500">{resource.resourceType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{resource.progress}%</p>
                    <p className="text-xs text-gray-500">进度</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${resource.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                  <span>总学习: {DataFormatter.formatDuration(stats.totalTime)}</span>
                  <span>{stats.totalSessions} 次</span>
                </div>

                <button
                  onClick={() => handleStartSession(resource)}
                  disabled={!!currentSession}
                  className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  开始学习
                </button>
              </div>
            );
          })}
        </div>

        {studyableResources.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无可学习资源</p>
          </div>
        )}
      </div>

      {/* 学习统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{StudyCalculator.calculateStudyStreak(studyRecords)}</p>
          <p className="text-sm text-gray-500">连续学习天数</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{DataFormatter.formatDuration(StudyCalculator.calculateTotalHours(studyRecords) * 60)}</p>
          <p className="text-sm text-gray-500">总学习时长</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{studyRecords.length}</p>
          <p className="text-sm text-gray-500">学习次数</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{StudyCalculator.calculateAverageProgress(resources)}%</p>
          <p className="text-sm text-gray-500">平均进度</p>
        </div>
      </div>

      {/* 最近学习记录 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近学习记录</h2>
        <div className="space-y-4">
          {recentRecords.map((record) => {
            const resource = resources.find(r => r.id === record.resourceId);
            return (
              <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">{resource?.title}</p>
                    <p className="text-sm text-gray-500">
                      {DataFormatter.formatDate(record.startTime)} • 
                      {DataFormatter.formatDuration(record.duration)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {record.progressBefore}% → {record.progressAfter}%
                  </p>
                  <p className="text-xs text-gray-500">进度变化</p>
                </div>
              </div>
            );
          })}
        </div>

        {recentRecords.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无学习记录</p>
          </div>
        )}
      </div>
    </div>
  );
}