import { Resource, StudyRecord, PaymentRecord } from '../types';

// 学习统计计算工具类
export class StudyCalculator {
  // 计算总学习时长（分钟）
  static calculateTotalHours(records: StudyRecord[]): number {
    const totalMinutes = records.reduce((total, record) => total + record.duration, 0);
    return Math.round(totalMinutes / 60 * 100) / 100; // 保留2位小数
  }

  // 计算平均进度
  static calculateAverageProgress(resources: Resource[]): number {
    if (resources.length === 0) return 0;
    
    const totalProgress = resources.reduce((total, resource) => total + resource.progress, 0);
    return Math.round(totalProgress / resources.length * 100) / 100;
  }

  // 计算完成率
  static calculateCompletionRate(resources: Resource[]): number {
    if (resources.length === 0) return 0;
    
    const completedCount = resources.filter(resource => resource.status === 'completed').length;
    return Math.round(completedCount / resources.length * 100 * 100) / 100;
  }

  // 计算连续学习天数
  static calculateStudyStreak(records: StudyRecord[]): number {
    if (records.length === 0) return 0;
    
    const dates = records
      .map(record => new Date(record.startTime).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index) // 去重
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < dates.length; i++) {
      const recordDate = new Date(dates[i]);
      const daysDiff = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // 获取最近学习记录
  static getRecentStudyRecords(records: StudyRecord[], limit: number = 10): StudyRecord[] {
    return records
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // 计算本周学习时长
  static calculateWeeklyStudyTime(records: StudyRecord[]): number {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyRecords = records.filter(record => 
      record.startTime >= startOfWeek
    );
    
    return weeklyRecords.reduce((total, record) => total + record.duration, 0);
  }

  // 计算本月学习时长
  static calculateMonthlyStudyTime(records: StudyRecord[]): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyRecords = records.filter(record => 
      record.startTime >= startOfMonth
    );
    
    return monthlyRecords.reduce((total, record) => total + record.duration, 0);
  }
}