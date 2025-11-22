-- 用户表 - 扩展aipexbase默认用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `email` varchar(255) NOT NULL DEFAULT '' COMMENT '邮箱地址',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号',
  `password` varchar(255) DEFAULT '' COMMENT '密码',
  `nick_name` varchar(100) DEFAULT '' COMMENT '昵称',
  `avatar` varchar(500) DEFAULT '' COMMENT '头像URL',
  `user_type` varchar(20) NOT NULL DEFAULT 'student' COMMENT '用户类型',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT '状态',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表 - 扩展aipexbase默认用户表';

-- 学习资源表
CREATE TABLE IF NOT EXISTS `resources` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '资源ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `title` varchar(200) NOT NULL DEFAULT '' COMMENT '资源标题',
  `description` text COMMENT '资源描述',
  `resource_type` varchar(50) NOT NULL DEFAULT 'book' COMMENT '资源类型',
  `subject` varchar(100) DEFAULT '' COMMENT '学科',
  `author` varchar(100) DEFAULT '' COMMENT '作者',
  `purchase_date` date DEFAULT NULL COMMENT '购买日期',
  `price` decimal(10,2) DEFAULT '0.00' COMMENT '价格',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT '状态',
  `image_url` varchar(500) DEFAULT '' COMMENT '图片URL',
  `file_url` varchar(500) DEFAULT '' COMMENT '文件URL',
  `notes` text COMMENT '备注',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_resource_type` (`resource_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_resources_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习资源表';

-- 学习进度表
CREATE TABLE IF NOT EXISTS `study_progress` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '进度ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `resource_id` bigint NOT NULL COMMENT '资源ID',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `target_completion_date` date DEFAULT NULL COMMENT '目标完成日期',
  `actual_completion_date` date DEFAULT NULL COMMENT '实际完成日期',
  `progress_percentage` int NOT NULL DEFAULT '0' COMMENT '进度百分比',
  `study_hours` decimal(5,1) DEFAULT '0.0' COMMENT '学习时长(小时)',
  `difficulty_level` varchar(20) DEFAULT 'medium' COMMENT '难度等级',
  `status` varchar(20) NOT NULL DEFAULT 'in_progress' COMMENT '状态',
  `notes` text COMMENT '学习笔记',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_study_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_study_progress_resource` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习进度表';

-- 付款记录表
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '付款ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `resource_id` bigint DEFAULT NULL COMMENT '资源ID',
  `payment_date` date NOT NULL COMMENT '付款日期',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '付款金额',
  `payment_method` varchar(50) DEFAULT 'cash' COMMENT '付款方式',
  `payment_status` varchar(20) NOT NULL DEFAULT 'completed' COMMENT '付款状态',
  `description` varchar(500) DEFAULT '' COMMENT '付款描述',
  `receipt_url` varchar(500) DEFAULT '' COMMENT '收据URL',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_payment_date` (`payment_date`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_resource` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='付款记录表';

-- 插入默认管理员用户（密码：admin123）
INSERT INTO `users` (`email`, `phone`, `password`, `nick_name`, `user_type`, `status`, `created_at`, `updated_at`) VALUES 
('admin@example.com', '', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '管理员', 'admin', 'active', NOW(), NOW());

-- 插入测试用户（密码：password）
INSERT INTO `users` (`email`, `phone`, `password`, `nick_name`, `user_type`, `status`, `created_at`, `updated_at`) VALUES 
('test@example.com', '13800138000', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '测试用户', 'student', 'active', NOW(), NOW());