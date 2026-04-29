import subprocess
from datetime import datetime
from collections import defaultdict

# 設定 AI 引入的切換點 (2025 年底)
AI_START_DATE = datetime(2025, 11, 1)

def get_git_logs():
    """獲取 Git 提交紀錄：日期、新增行數、刪除行數"""
    try:
        # 格式: 日期(YYYY-MM-DD), 新增行數, 刪除行數
        output = subprocess.check_output(
            ['git', 'log', '--pretty=format:%ad', '--date=short', '--numstat'],
            encoding='utf-8'
        ).split('\n')
        return output
    except Exception as e:
        print(f"錯誤: 無法讀取 Git 紀錄。請確保你在 Git 專案目錄下執行。{e}")
        return []

def analyze_velocity():
    logs = get_git_logs()
    daily_stats = defaultdict(lambda: {'commits': 0, 'added': 0, 'deleted': 0})
    
    current_date = None
    for line in logs:
        if not line.strip():
            continue
        
        # 判斷是否為日期列 (YYYY-MM-DD)
        if len(line) == 10 and line.count('-') == 2:
            current_date = datetime.strptime(line, '%Y-%m-%d')
            daily_stats[current_date]['commits'] += 1
        else:
            # 判斷是否為 numstat 列 (added deleted filename)
            parts = line.split('\t')
            if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
                if current_date:
                    daily_stats[current_date]['added'] += int(parts[0])
                    daily_stats[current_date]['deleted'] += int(parts[1])

    # 分類統計
    pre_ai = {'days': 0, 'commits': 0, 'added': 0}
    post_ai = {'days': 0, 'commits': 0, 'added': 0}

    for date, stat in daily_stats.items():
        if date < AI_START_DATE:
            pre_ai['days'] += 1
            pre_ai['commits'] += stat['commits']
            pre_ai['added'] += stat['added']
        else:
            post_ai['days'] += 1
            post_ai['commits'] += stat['commits']
            post_ai['added'] += stat['added']

    # 計算平均值
    def get_avg(data):
        if data['days'] == 0: return 0, 0
        return data['commits'] / data['days'], data['added'] / data['days']

    pre_avg_c, pre_avg_l = get_avg(pre_ai)
    post_avg_c, post_avg_l = get_avg(post_ai)

    # Output results
    print("\n" + "="*50)
    print(" AI Development Velocity Report")
    print("="*50)
    print(f"Period: {min(daily_stats.keys()).date()} ~ {max(daily_stats.keys()).date()}")
    print("-" * 50)
    print(f"[Pre-AI Era]")
    print(f" - Avg Commits/Day: {pre_avg_c:.2f}")
    print(f" - Avg Lines/Day: {pre_avg_l:.0f} LoC")
    print("-" * 50)
    print(f"[AI-Augmented Era]")
    print(f" - Avg Commits/Day: {post_avg_c:.2f} (Boost: {((post_avg_c/pre_avg_c-1)*100 if pre_avg_c > 0 else 100):.1f}%)")
    print(f" - Avg Lines/Day: {post_avg_l:.0f} LoC (Boost: {((post_avg_l/pre_avg_l-1)*100 if pre_avg_l > 0 else 100):.1f}%)")
    print("="*50)
    print("\nTip: You can use these stats in your README to prove AI productivity boost!\n")

if __name__ == "__main__":
    analyze_velocity()
