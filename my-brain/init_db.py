import sqlite3
import os

def init_db():
    db_path = 'brain.db'
    
    # Kết nối (hoặc tạo mới) file database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Tạo bảng knowledge
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS knowledge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"Đã khởi tạo thành công cơ sở dữ liệu: {os.path.abspath(db_path)}")

if __name__ == "__main__":
    init_db()
