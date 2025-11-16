// 学习记录接口
export interface StudyRecord {
  id: string;
  resourceId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // 分钟
  notes: string;
  progressBefore: number;
  progressAfter: number;
  createdAt: Date;
}

// 学习会话接口（用于当前学习状态）
export interface StudySession {
  id: string;
  resourceId: string;
  startTime: Date;
  currentProgress: number;
  isPaused?: boolean;
  pausedAt?: Date;
  totalPausedMs?: number;
}

// 学习统计接口
export interface StudyStatistics {
  totalStudyTime: number; // 总学习时长（分钟）
  totalSessions: number; // 总学习次数
  averageSessionDuration: number; // 平均学习时长
  studyStreak: number; // 连续学习天数
  weeklyStudyTime: number; // 本周学习时长
  monthlyStudyTime: number; // 本月学习时长
}