#!/bin/bash

# 服务监控脚本
# 添加到crontab中定期执行: */5 * * * * /path/to/monitor.sh

LOG_FILE="/var/log/encrypted-image-monitor.log"
SERVICE_NAME="encrypted-image-backend"

# 检查服务状态
check_service() {
    if ! pm2 list | grep -q "$SERVICE_NAME.*online"; then
        echo "$(date): 服务异常，尝试重启..." >> $LOG_FILE
        pm2 restart $SERVICE_NAME
        echo "$(date): 服务已重启" >> $LOG_FILE
        
        # 发送告警通知（可选）
        # curl -X POST "https://api.telegram.org/bot<token>/sendMessage" -d "chat_id=<chat_id>&text=服务已重启"
    fi
}

# 清理过期文件
cleanup_files() {
    STORAGE_DIR="/root/server/storage"
    find $STORAGE_DIR -type f -mtime +1 -delete
    echo "$(date): 清理过期文件完成" >> $LOG_FILE
}

# 检查磁盘空间
check_disk_space() {
    USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        echo "$(date): 警告：磁盘使用率 ${USAGE}%" >> $LOG_FILE
        # 发送告警通知
    fi
}

# 执行检查
check_service
cleanup_files
check_disk_space