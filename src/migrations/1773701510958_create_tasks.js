export async function up(pool) {
	await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id CHAR(36) PRIMARY KEY,
      title VARCHAR(1024) NOT NULL UNIQUE,
      status VARCHAR(64) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_title (title),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `)
}

export async function down(pool) {
	await pool.query("DROP TABLE IF EXISTS tasks")
}
