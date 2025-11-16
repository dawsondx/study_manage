import { Resource, PaymentRecord, StudyRecord } from '../types';

// 数据验证工具类
export class DataValidator {
  // 验证资源数据
  static validateResource(resource: Partial<Resource>): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证标题
    if (!resource.title || resource.title.trim().length === 0) {
      errors.push({ field: 'title', message: '资源标题不能为空' });
    } else if (resource.title.length > 200) {
      errors.push({ field: 'title', message: '资源标题不能超过200个字符' });
    }

    // 验证描述
    if (resource.description && resource.description.length > 1000) {
      errors.push({ field: 'description', message: '资源描述不能超过1000个字符' });
    }

    // 验证价格
    if (resource.price !== undefined) {
      if (resource.price < 0) {
        errors.push({ field: 'price', message: '价格不能为负数' });
      } else if (resource.price > 999999) {
        errors.push({ field: 'price', message: '价格不能超过999999' });
      }
    }

    // 验证进度
    if (resource.progress !== undefined) {
      if (resource.progress < 0 || resource.progress > 100) {
        errors.push({ field: 'progress', message: '进度必须在0-100之间' });
      }
    }

    // 验证实际学习时间
    if (resource.actualHours !== undefined && resource.actualHours < 0) {
      errors.push({ field: 'actualHours', message: '实际学习时间不能为负数' });
    }

    // 验证预计学习时间
    if (resource.estimatedHours !== undefined && resource.estimatedHours < 0) {
      errors.push({ field: 'estimatedHours', message: '预计学习时间不能为负数' });
    }

    // 验证购买链接
    if (resource.purchaseUrl && !this.isValidUrl(resource.purchaseUrl)) {
      errors.push({ field: 'purchaseUrl', message: '购买链接格式不正确' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 验证支付记录
  static validatePayment(payment: Partial<PaymentRecord>): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证金额
    if (payment.amount === undefined || payment.amount <= 0) {
      errors.push({ field: 'amount', message: '支付金额必须大于0' });
    } else if (payment.amount > 999999) {
      errors.push({ field: 'amount', message: '支付金额不能超过999999' });
    }

    // 验证支付日期
    if (payment.paymentDate) {
      const paymentDate = new Date(payment.paymentDate);
      const now = new Date();
      
      if (isNaN(paymentDate.getTime())) {
        errors.push({ field: 'paymentDate', message: '支付日期格式不正确' });
      } else if (paymentDate > now) {
        errors.push({ field: 'paymentDate', message: '支付日期不能是未来日期' });
      }
    }

    // 验证支付方式
    if (!payment.paymentMethod || payment.paymentMethod.trim().length === 0) {
      errors.push({ field: 'paymentMethod', message: '支付方式不能为空' });
    }

    // 验证备注
    if (payment.notes && payment.notes.length > 500) {
      errors.push({ field: 'notes', message: '备注不能超过500个字符' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 验证学习记录
  static validateStudyRecord(record: Partial<StudyRecord>): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证开始时间
    if (!record.startTime) {
      errors.push({ field: 'startTime', message: '开始时间不能为空' });
    } else {
      const startTime = new Date(record.startTime);
      if (isNaN(startTime.getTime())) {
        errors.push({ field: 'startTime', message: '开始时间格式不正确' });
      }
    }

    // 验证结束时间
    if (record.endTime) {
      const startTime = new Date(record.startTime!);
      const endTime = new Date(record.endTime);
      
      if (isNaN(endTime.getTime())) {
        errors.push({ field: 'endTime', message: '结束时间格式不正确' });
      } else if (endTime <= startTime) {
        errors.push({ field: 'endTime', message: '结束时间必须晚于开始时间' });
      }
    }

    // 验证学习时长
    if (record.duration !== undefined) {
      if (record.duration < 0) {
        errors.push({ field: 'duration', message: '学习时长不能为负数' });
      } else if (record.duration > 1440) { // 24小时
        errors.push({ field: 'duration', message: '单次学习时长不能超过24小时' });
      }
    }

    // 验证进度
    if (record.progressBefore !== undefined) {
      if (record.progressBefore < 0 || record.progressBefore > 100) {
        errors.push({ field: 'progressBefore', message: '学习前进度必须在0-100之间' });
      }
    }

    if (record.progressAfter !== undefined) {
      if (record.progressAfter < 0 || record.progressAfter > 100) {
        errors.push({ field: 'progressAfter', message: '学习后进度必须在0-100之间' });
      }
    }

    // 验证学习后进度不能低于学习前进度
    if (record.progressBefore !== undefined && record.progressAfter !== undefined) {
      if (record.progressAfter < record.progressBefore) {
        errors.push({ field: 'progressAfter', message: '学习后进度不能低于学习前进度' });
      }
    }

    // 验证备注
    if (record.notes && record.notes.length > 1000) {
      errors.push({ field: 'notes', message: '学习备注不能超过1000个字符' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 验证URL
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // 验证邮箱
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号（中国）
  static isValidChinesePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 通用字段长度验证
  static validateLength(value: string, fieldName: string, minLength?: number, maxLength?: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (minLength !== undefined && value.length < minLength) {
      errors.push({ field: fieldName, message: `${fieldName}最少需要${minLength}个字符` });
    }

    if (maxLength !== undefined && value.length > maxLength) {
      errors.push({ field: fieldName, message: `${fieldName}不能超过${maxLength}个字符` });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 验证错误接口
export interface ValidationError {
  field: string;
  message: string;
}